const log = require('../utils/logger');
const db = require('../config/db');

async function getAll({ status } = {}) {
  log.db(`Получение списка бронирований`, { status: status || 'все' });
  let sql = `
    SELECT b.*, u.username,
           t.name AS tool_name,
           (SELECT filename FROM tool_images WHERE tool_id = t.id ORDER BY created_at LIMIT 1) AS tool_image
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN tools  t ON b.tool_id = t.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND b.status = ?'; params.push(status); }
  sql += ' ORDER BY b.created_at DESC';
  const [rows] = await db.execute(sql, params);
  log.success(`Получено ${rows.length} бронирований`);
  return rows;
}

async function getByUser(userId, { status } = {}) {
  log.db(`Получение бронирований пользователя ${userId}`, { status: status || 'все' });
  let sql = `
    SELECT b.*, t.name AS tool_name,
           (SELECT filename FROM tool_images WHERE tool_id = t.id ORDER BY created_at LIMIT 1) AS tool_image
    FROM bookings b
    JOIN tools t ON b.tool_id = t.id
    WHERE b.user_id = ?
  `;
  const params = [userId];
  if (status) { sql += ' AND b.status = ?'; params.push(status); }
  sql += ' ORDER BY b.created_at DESC';
  const [rows] = await db.execute(sql, params);
  log.success(`Получено ${rows.length} бронирований для пользователя ${userId}`);
  return rows;
}

async function create({ user_id, tool_id, quantity, note }) {
  const [result] = await db.execute(
    'INSERT INTO bookings (user_id, tool_id, quantity, note) VALUES (?, ?, ?, ?)',
    [user_id, tool_id, quantity || 1, note || null]
  );
  return result.insertId;
}

async function updateStatus(id, status) {
  await db.execute('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
}

async function getActiveQuantity(tool_id) {
  log.db(`Получение активного количества бронирований для инструмента ${tool_id}`);
  const [rows] = await db.execute(
    `SELECT COALESCE(SUM(quantity), 0) AS total
     FROM bookings
     WHERE tool_id = ? AND status IN ('approved', 'issued')`,
    [tool_id]
  );
  const total = Number(rows[0].total);
  log.success(`Активное количество бронирований для инструмента ${tool_id}: ${total}`);
  return total;
}

module.exports = { getAll, getByUser, create, updateStatus, getActiveQuantity };
