import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { sql } from '@vercel/postgres';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Brukernavn og passord er påkrevd' }, { status: 400 });
    }

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        subscription_status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const result = await sql`SELECT * FROM users WHERE username = ${username}`;
    const rows = result.rows;
    
    if (rows.length === 0) {
      const allUsers = await sql`SELECT COUNT(*) as count FROM users`;
      if (parseInt(allUsers.rows[0].count) === 0) {
        const hash = await bcrypt.hash(password, 10);
        await sql`INSERT INTO users (username, password_hash) VALUES (${username}, ${hash})`;
        
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_123');
        const token = await new SignJWT({ username })
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('24h')
          .sign(secret);
          
        const response = NextResponse.json({ success: true, message: 'Første bruker opprettet' });
        response.cookies.set('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24
        });
        return response;
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Ugyldig brukernavn eller passord' }, { status: 401 });
    }

    const user = rows[0];

    if (user.subscription_status !== 'active') {
      return NextResponse.json({ error: 'Abonnementet ditt er ikke aktivt' }, { status: 403 });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Ugyldig brukernavn eller passord' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_123');
    const token = await new SignJWT({ username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

    const response = NextResponse.json({ success: true });
    
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Noe gikk galt med innloggingen' }, { status: 500 });
  }
}
