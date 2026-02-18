import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || 'appuserpasswd',
  database: process.env.DB_NAME || 'coffeedb',
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
