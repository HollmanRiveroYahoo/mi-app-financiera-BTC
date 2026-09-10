require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function lagBruker() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.log('Bruk: node lag-bruker.js <brukernavn> <passord>');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
  });

  try {
    console.log('Kobler til Vercel/Prisma Postgres databasen...');
    await client.connect();

    const hash = await bcrypt.hash(password, 10);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        subscription_status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const existingUser = await client.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUser.rowCount > 0) {
      console.error('\n❌ FEIL: Brukernavnet finnes allerede i databasen.');
      process.exit(1);
    }

    await client.query(
      `INSERT INTO users (username, password_hash, subscription_status) VALUES ($1, $2, 'active')`,
      [username, hash]
    );

    console.log('\n✅ SUKSESS! Brukeren "' + username + '" er opprettet med aktivt abonnement.');
    console.log('De kan nå logge inn i appen.');

  } catch (error) {
    console.error('\n❌ FEIL VED TILKOBLING ELLER LAGRING:');
    console.error(error.message);
  } finally {
    await client.end();
  }
}

lagBruker();
