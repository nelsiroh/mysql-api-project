// DataDog Trace
// import tracer from 'dd-trace';

// tracer.init({
//   service: process.env.DD_SERVICE || 'coffee-api',
//   env: process.env.DD_ENV || 'local',
//   version: process.env.DD_VERSION || 'dev',
//   logInjection: true,
// });

import express from 'express';
import pool from './db.js';
import crypto from 'crypto';
import { metricsHandler } from './telemetry/registry.js';
import { orderMetrics } from './telemetry/orderMetrics.js';
import { metricsMiddleware } from './telemetry/middleware.js';

const app = express();
app.use(metricsMiddleware());
app.use(express.json());

// GET health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET Prometheus metrics
app.get('/metrics', metricsHandler);

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
async function rollbackAndRespond(conn, res, statusCode, payload, reason = 'unknown') {
  orderMetrics.recordRollback(reason);
  try { await conn.rollback(); } catch (_) {}
  return res.status(statusCode).json(payload);
}

// POST coffee transaction
app.post('/order', async (req, res) => {
  const stopOrderTimer = orderMetrics.startOrderCreateTimer();
  const errors = [];
  let conn;

  const customer_id = Number(req.body?.customer_id);
  const coffee_id = Number(req.body?.coffee_id);
  const quantity = Number(req.body?.quantity);

  if (!Number.isInteger(customer_id)) {
    errors.push({ field: 'customer_id', message: 'must be an integer' });
    orderMetrics.recordValidationFailure('customer_id');
  }

  if (!Number.isInteger(coffee_id)) {
    errors.push({ field: 'coffee_id', message: 'must be an integer' });
    orderMetrics.recordValidationFailure('coffee_id');
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    errors.push({ field: 'quantity', message: 'must be a positive integer' });
    orderMetrics.recordValidationFailure('quantity');
  }

  if (errors.length) {
    stopOrderTimer('validation_error');
    return res.status(400).json({ errors });
  }

  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Validate customer exists
    const [custRows] = await conn.query(
      'SELECT id FROM customer_table WHERE id = ? LIMIT 1',
      [customer_id]
    );
    if (custRows.length === 0) {
      orderMetrics.recordCreateFailure('customer_lookup', 'customer_not_found');
      stopOrderTimer('customer_not_found');
      return await rollbackAndRespond(conn, res, 404, { error: 'customer not found' }, 'customer_not_found');
    }

    // Validate coffee exists and fetch current unit_price
    const [coffeeRows] = await conn.query(
      'SELECT id, name, unit_price FROM coffee_table WHERE id = ? LIMIT 1',
      [coffee_id]
    );
    if (coffeeRows.length === 0) {
      orderMetrics.recordCreateFailure('coffee_lookup', 'coffee_not_found');
      stopOrderTimer('coffee_not_found');
      return await rollbackAndRespond(conn, res, 404, { error: 'coffee not found' }, 'coffee_not_found');
    }

    const coffee = coffeeRows[0];
    const unit_price = toMoney(coffee.unit_price);

    if (!Number.isFinite(unit_price) || unit_price < 0) {
      orderMetrics.recordCreateFailure('price_validation', 'invalid_unit_price');
      stopOrderTimer('invalid_unit_price');
      return await rollbackAndRespond(conn, res, 500, { error: 'invalid unit_price in coffee_table' }, 'invalid_unit_price');
    }

    const line_total = round2(unit_price * quantity);

    // Validate TAX_RATE config.
    const taxRate = Number(process.env.TAX_RATE ?? 0.0825);
    if (!Number.isFinite(taxRate) || taxRate < 0) {
      orderMetrics.recordCreateFailure('tax_configuration', 'invalid_tax_rate');
      stopOrderTimer('invalid_tax_rate');
      return await rollbackAndRespond(conn, res, 500, { error: 'invalid TAX_RATE configuration' }, 'invalid_tax_rate');
    }

    const subtotal = round2(line_total);
    const tax = round2(subtotal * taxRate);
    const grand_total = round2(subtotal + tax);

    // Retry order insert on order_number collision.
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
        // MySQL duplicate key: ER_DUP_ENTRY (errno 1062).
        const isDup = e?.errno === 1062 || e?.code === 'ER_DUP_ENTRY';
        if (isDup && attempt < maxAttempts) continue;
        throw e;
      }
    }

    if (!order_id) {
      throw new Error('failed to generate unique order_number after retries');
    }

    // Snapshot unit_price at order time.
    await conn.query(
      `
        INSERT INTO order_items (order_id, coffee_id, quantity, unit_price, line_total)
        VALUES (?, ?, ?, ?, ?)
      `,
      [order_id, coffee_id, quantity, round2(unit_price), line_total]
    );

    await conn.commit();
    orderMetrics.recordOrderCreated('PENDING');
    stopOrderTimer('success');

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
    orderMetrics.recordCreateFailure('order_create', err?.code || 'unhandled_error');
    orderMetrics.recordRollback(err?.code || 'unhandled_error');
    stopOrderTimer('error');
    if (conn) {
      try { await conn.rollback(); } catch (_) {}
    }
    return res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// PATCH order status
app.patch('/order/:id/status', async (req, res) => {
  const order_id = Number(req.params.id);
  const newStatus = req.body?.status;

  const allowedTransitions = {
    PENDING: ['PAID', 'CANCELLED'],
    PAID: ['FULFILLED', 'REFUNDED'],
    FULFILLED: ['REFUNDED'],
    CANCELLED: [],
    REFUNDED: [],
  };

  const validStatuses = Object.keys(allowedTransitions);

  if (!Number.isInteger(order_id)) {
    return res.status(400).json({ error: 'invalid order id' });
  }

  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({ error: 'invalid status value' });
  }

  try {
    const [existingRows] = await pool.query(
      `SELECT id, status, updated_at FROM orders WHERE id = ?`,
      [order_id]
    );

    if (existingRows.length === 0) {
      orderMetrics.recordStatusTransition('missing', newStatus, 'not_found');
      return res.status(404).json({ error: 'order not found' });
    }

    const existingOrder = existingRows[0];

    if (existingOrder.status === newStatus) {
      orderMetrics.recordStatusTransition(existingOrder.status, newStatus, 'noop');
      return res.json({
        id: existingOrder.id,
        status: existingOrder.status,
        updated_at: existingOrder.updated_at,
      });
    }

    if (!allowedTransitions[existingOrder.status].includes(newStatus)) {
      orderMetrics.recordStatusTransition(existingOrder.status, newStatus, 'invalid_transition');
      return res.status(409).json({
        error: `cannot transition order from ${existingOrder.status} to ${newStatus}`
      });
    }

    const [updateResult] = await pool.query(
      `UPDATE orders SET status = ? WHERE id = ? AND status = ?`,
      [newStatus, order_id, existingOrder.status]
    );

    if (updateResult.affectedRows === 0) {
      orderMetrics.recordStatusTransition(existingOrder.status, newStatus, 'conflict');
      return res.status(409).json({ error: 'order status changed during update' });
    }

    orderMetrics.recordStatusTransition(existingOrder.status, newStatus, 'updated');

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
