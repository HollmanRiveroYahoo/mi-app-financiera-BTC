import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@vercel/postgres';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password || password.length < 6) {
      return NextResponse.json({ error: 'Ugyldig brukernavn eller for kort passord' }, { status: 400 });
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

    const existing = await sql`SELECT * FROM users WHERE username = ${username}`;
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Brukernavnet er allerede i bruk' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    
    await sql`
      INSERT INTO users (username, password_hash, subscription_status) 
      VALUES (${username}, ${hash}, 'active')
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Kunne ikke opprette bruker' }, { status: 500 });
  }
}
