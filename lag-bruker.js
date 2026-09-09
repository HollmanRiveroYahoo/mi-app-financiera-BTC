require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function lagBruker() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.log('Bruk: node lag-bruker.js <brukernavn> <passord>');
    process.exit(1);
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Koblet til Domeneshop databasen...');

    // Krypter passordet
    const hash = await bcrypt.hash(password, 10);

    // Sett inn i databasen
    await connection.execute(
      'INSERT INTO users (username, password_hash, subscription_status) VALUES (?, ?, ?)',
      [username, hash, 'active']
    );

    console.log('\n? SUKSESS! Brukeren "' + username + '" er opprettet med aktivt abonnement.');
    console.log('De kan n? logge inn i appen.');

    await connection.end();
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.error('\n? FEIL: Brukernavnet finnes allerede i databasen.');
    } else {
      console.error('\n? FEIL VED TILKOBLING ELLER LAGRING:');
      console.error(error.message);
    }
  }
}

lagBruker();
