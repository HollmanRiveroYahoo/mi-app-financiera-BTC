require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('Kobler til', process.env.DB_HOST, 'med bruker', process.env.DB_USER);
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('Suksess! Tilkoblet til MySQL hos Domeneshop.');
    
    // Opprett users-tabellen om den ikke finnes
    const createTableQuery = \
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        subscription_status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    \;
    await connection.execute(createTableQuery);
    console.log('Tabell "users" sjekket/opprettet.');

    const [rows] = await connection.execute('SELECT * FROM users');
    console.log('Brukere i databasen:', rows.length);

    await connection.end();
  } catch (error) {
    console.error('Feil ved tilkobling til databasen:');
    console.error(error.message);
  }
}

testConnection();
