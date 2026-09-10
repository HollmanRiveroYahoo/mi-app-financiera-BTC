import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { Client } from 'pg';

export async function POST(request) {
  const client = new Client({ connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL });
  
  try {
    await client.connect();
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Brukernavn og passord er påkrevd' }, { status: 400 });
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        subscription_status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
    const rows = result.rows;
    
    if (rows.length === 0) {
      const allUsers = await client.query('SELECT COUNT(*) as count FROM users');
      if (parseInt(allUsers.rows[0].count) === 0) {
        const hash = await bcrypt.hash(password, 10);
        await client.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [username, hash]);
        
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
  } finally {
    await client.end();
  }
}
