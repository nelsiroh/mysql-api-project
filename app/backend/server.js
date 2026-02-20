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

// Rollback handler
async function rollbackAndRespond(conn, res, statusCode, payload) {
  try { await conn.rollback(); } catch (_) {}
  return res.status(statusCode).json(payload);
}

// POST coffee transaction
app.post('/order', async (req, res) => {
  const errors = [];

  const customer_id = Number(req.body?.customer_id);
  const coffee_id = Number(req.body?.coffee_id);
  const quantity = Number(req.body?.quantity);

  if (!Number.isInteger(customer_id)) errors.push({ field: 'customer_id', message: 'must be an integer' });
  if (!Number.isInteger(coffee_id)) errors.push({ field: 'coffee_id', message: 'must be an integer' });
  if (!Number.isInteger(quantity) || quantity <= 0) {
    errors.push({ field: 'quantity', message: 'must be a positive integer' });
  }

  if (errors.length) return res.status(400).json({ errors });

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Validate customer exists
    const [custRows] = await conn.query(
      'SELECT id FROM customer_table WHERE id = ? LIMIT 1',
      [customer_id]
    );
    if (custRows.length === 0) {
      return await rollbackAndRespond(conn, res, 404, { error: 'customer not found' });
    }

    // Validate coffee exists and fetch current unit_price
    const [coffeeRows] = await conn.query(
      'SELECT id, name, unit_price FROM coffee_table WHERE id = ? LIMIT 1',
      [coffee_id]
    );
    if (coffeeRows.length === 0) {
      return await rollbackAndRespond(conn, res, 404, { error: 'coffee not found' });
    }

    const coffee = coffeeRows[0];
    const unit_price = toMoney(coffee.unit_price);

    if (!Number.isFinite(unit_price) || unit_price < 0) {
      return await rollbackAndRespond(conn, res, 500, { error: 'invalid unit_price in coffee_table' });
    }

    const line_total = round2(unit_price * quantity);

    // Validate tax rate: store as runtime config
    const taxRate = Number(process.env.TAX_RATE ?? 0.0825);
    if (!Number.isFinite(taxRate) || taxRate < 0) {
      return await rollbackAndRespond(conn, res, 500, { error: 'invalid TAX_RATE configuration' });
    }

    const subtotal = round2(line_total);
    const tax = round2(subtotal * taxRate);
    const grand_total = round2(subtotal + tax);

    // Create order shell (retry on  order_number collision)
    const maxAttempts = 3;
    let order_id;
    let order_number;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      order_number = generateOrderNumber26();

      try {
        const [orderResult] = await conn.query(
          `
            INSERT INTO orders (order_number, customer_id, subtotal, tax, grand_total, status)
            VALUES (?, ?, ?, ?, ?, 'PENDING')
          `,
          [order_number, customer_id, subtotal, tax, grand_total]
        );

        order_id = orderResult.insertId;
        break;
      } catch (e) {
        // MySQL duplicate key: ER_DUP_ENTRY (errno 1062)
        const isDup = e?.errno === 1062 || e?.code === 'ER_DUP_ENTRY';
        if (isDup && attempt < maxAttempts) continue;
        throw e;
      }
    }

    if (!order_id) {
      throw new Error('failed to generate unique order_number after retries');
    }

    // Create order item (price snapshot)
    await conn.query(
      `
        INSERT INTO order_items (order_id, coffee_id, quantity, unit_price, line_total)
        VALUES (?, ?, ?, ?, ?)
      `,
      [order_id, coffee_id, quantity, round2(unit_price), line_total]
    );

    await conn.commit();

    return res.status(201).json({
      id: order_id,
      order_number,
      customer_id,
      status: 'PENDING',
      items: [
        {
          coffee_id,
          coffee_name: coffee.name,
          quantity,
          unit_price: round2(unit_price),
          line_total,
        },
      ],
      subtotal,
      tax,
      grand_total,
      tax_rate: taxRate,
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    return res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// PATCH order status
app.patch('/order/:id/status', async (req, res) => {
  const order_id = Number(req.params.id);
  const newStatus = req.body?.status;

  const validStatuses = ['PENDING', 'PAID', 'FULFILLED', 'CANCELLED', 'REFUNDED'];

  if (!Number.isInteger(order_id)) {
    return res.status(400).json({ error: 'invalid order id' });
  }

  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({ error: 'invalid status value' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE orders SET status = ? WHERE id = ? AND status <> ?`,
      [newStatus, order_id, newStatus]
    );

    if (result.affectedRows === 0) {
      // Either not found, or already in that status.
      const [rows] = await pool.query(`SELECT id, status, updated_at FROM orders WHERE id = ?`, [order_id]);
      if (rows.length === 0) return res.status(404).json({ error: 'order not found' });
      return res.json({ id: rows[0].id, status: rows[0].status, updated_at: rows[0].updated_at });
    }

    const [rows] = await pool.query(`SELECT id, status, updated_at FROM orders WHERE id = ?`, [order_id]);
    return res.json(rows[0]);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Helper Functions

// Round a numeric value to 2 decimal places using IEEE-safe rounding (avoids common floating-point drift).
function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

// Normalize MySQL DECIMAL values into JavaScript numbers. 
// mysql2 often returns DECIMAL columns as strings to preserve precision. This helper ensures consistent numeric behavior in calculations.
function toMoney(v) {
  // mysql2 may return DECIMAL as string; normalize to number
  const n = typeof v === 'string' ? Number(v) : Number(v);
  return n;
}

// 26-char order_number (schema: CHAR(26)) - example: "20260220T154512-4F8Q2H"
function generateOrderNumber26() {
  const d = new Date();

  const yyyy = String(d.getUTCFullYear()).padStart(4, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const HH = String(d.getUTCHours()).padStart(2, '0');
  const MM = String(d.getUTCMinutes()).padStart(2, '0');
  const SS = String(d.getUTCSeconds()).padStart(2, '0');

  const ts = `${yyyy}${mm}${dd}T${HH}${MM}${SS}`; // 15 chars
  const rand = randomBase36(10).toUpperCase();   // 10 chars
  return `${ts}-${rand}`;                        // 15 + 1 + 10 = 26
}

// Generate a base36 string using cryptographically strong randomness.
function randomBase36(len) {
  const bytes = crypto.randomBytes(len);
  let out = '';

  for (let i = 0; i < bytes.length; i++) {
    out += (bytes[i] % 36).toString(36);
  }

  return out.slice(0, len);
}

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API running on port ${port}`));
