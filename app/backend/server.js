import tracer from 'dd-trace';

tracer.init({
  service: process.env.DD_SERVICE || 'coffee-api',
  env: process.env.DD_ENV || 'local',
  version: process.env.DD_VERSION || 'dev',
  logInjection: true,
});

import express from 'express';
import pool from './db.js';
import crypto from 'crypto';

const app = express();
app.use(express.json());

// GET health check
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

// POST coffee transaction
app.post('/order', async (req, res) =>
  {
    try {

    }
    catch (err) {
      
    }
  }
);

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API running on port ${port}`));
