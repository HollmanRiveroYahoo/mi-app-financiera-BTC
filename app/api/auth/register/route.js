import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Client } from 'pg';

export async function POST(request) {
  const client = new Client({ connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL });

  try {
    await client.connect();
    const { username, password } = await request.json();

    if (!username || !password || password.length < 6) {
      return NextResponse.json({ error: 'Ugyldig brukernavn eller for kort passord' }, { status: 400 });
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

    const existing = await client.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Brukernavnet er allerede i bruk' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    
    await client.query(
      `INSERT INTO users (username, password_hash, subscription_status) VALUES ($1, $2, 'active')`,
      [username, hash]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Kunne ikke opprette bruker' }, { status: 500 });
  } finally {
    await client.end();
  }
}
