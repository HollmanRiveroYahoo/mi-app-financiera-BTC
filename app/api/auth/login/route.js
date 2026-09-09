import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Brukernavn og passord er p?krevd' }, { status: 400 });
    }

    const pool = getDb();
    
    // Opprett tabell hvis den ikke finnes (f?rste gangs oppstart)
    await pool.execute(\
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        subscription_status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    \);

    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    
    if (rows.length === 0) {
      // HACK FOR ? LAGE TESTBRUKER HVIS DATABASEN ER TOM
      const [allUsers] = await pool.execute('SELECT COUNT(*) as count FROM users');
      if (allUsers[0].count === 0 && username === 'admin') {
        const hash = await bcrypt.hash(password, 10);
        await pool.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash]);
        return NextResponse.json({ message: 'Testbruker opprettet! Pr?v ? logge inn igjen.' }, { status: 201 });
      }
      return NextResponse.json({ error: 'Feil brukernavn eller passord' }, { status: 401 });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Feil brukernavn eller passord' }, { status: 401 });
    }

    if (user.subscription_status !== 'active') {
      return NextResponse.json({ error: 'Abonnementet ditt er ikke aktivt' }, { status: 403 });
    }

    // Generer JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_123');
    const token = await new SignJWT({ userId: user.id, username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

    // Sett cookie
    const response = NextResponse.json({ success: true, message: 'Logget inn!' });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 timer
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'En feil oppstod ved innlogging. Sjekk databasetilkobling.' }, { status: 500 });
  }
}
