require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');

async function lagBruker() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.log('Bruk: node lag-bruker.js <brukernavn> <passord>');
    process.exit(1);
  }

  try {
    console.log('Kobler til Vercel Postgres databasen...');

    const hash = await bcrypt.hash(password, 10);

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        subscription_status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const existingUser = await sql`SELECT * FROM users WHERE username = ${username}`;
    if (existingUser.rowCount > 0) {
      console.error('\n❌ FEIL: Brukernavnet finnes allerede i databasen.');
      process.exit(1);
    }

    await sql`
      INSERT INTO users (username, password_hash, subscription_status) 
      VALUES (${username}, ${hash}, 'active')
    `;

    console.log('\n✅ SUKSESS! Brukeren "' + username + '" er opprettet med aktivt abonnement.');
    console.log('De kan nå logge inn i appen.');

  } catch (error) {
    console.error('\n❌ FEIL VED TILKOBLING ELLER LAGRING:');
    console.error(error.message);
  }
}

lagBruker();
