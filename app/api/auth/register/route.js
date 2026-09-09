import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { username, password, subscriptionId } = await request.json();
    
    if (!username || !password || !subscriptionId) {
      return NextResponse.json({ error: 'Mangler data for registrering' }, { status: 400 });
    }

    const pool = getDb();

    // Sjekk om brukeren allerede finnes
    const [existing] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Brukernavnet er allerede tatt' }, { status: 400 });
    }

    // Hash passordet
    const hash = await bcrypt.hash(password, 10);

    // Sett inn ny bruker. Vi lagrer subscriptionId i subscription_status feltet for n?.
    await pool.execute(
      'INSERT INTO users (username, password_hash, subscription_status) VALUES (?, ?, ?)', 
      [username, hash, 'active'] // I en full prod-versjon b?r vi ha et eget paypal_subscription_id felt
    );

    return NextResponse.json({ success: true, message: 'Konto opprettet! Du kan n? logge inn.' });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'En feil oppstod ved registrering i databasen.' }, { status: 500 });
  }
}
