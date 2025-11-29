import express from 'express';
import pool from './db.js';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET coffee records
app.get('/coffees', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM coffee_table');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET users with preferred coffee
app.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.*, c.name AS favorite_coffee
      FROM customer_table u
      LEFT JOIN coffee_table c
        ON u.favorite = c.id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API running on port ${port}`));
