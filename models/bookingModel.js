const log = require('../utils/logger');
const db = require('../config/db');

async function getAll({ status, search, sort, page = 1, limit = 10 } = {}) {
  log.db(`Получение списка бронирований`, { status: status || 'все', search, sort, page, limit });

  const where = ['1=1'];
  const params = [];

  if (status) { where.push('b.status = ?'); params.push(status); }
  if (search) {
    where.push('(u.username LIKE ? OR t.name LIKE ? OR b.note LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const whereSql = where.join(' AND ');

  let orderSql;
  switch (sort) {
    case 'date_asc':   orderSql = 'b.created_at ASC'; break;
    case 'status':     orderSql = "FIELD(b.status, 'pending','approved','issued','returned','rejected'), b.created_at DESC"; break;
    case 'user':       orderSql = 'u.username ASC, b.created_at DESC'; break;
    case 'tool':       orderSql = 't.name ASC, b.created_at DESC'; break;
    case 'quantity':   orderSql = 'b.quantity DESC, b.created_at DESC'; break;
    case 'date_desc':
    default:           orderSql = 'b.created_at DESC';
  }

  const countSql = `
    SELECT COUNT(*) AS total
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN tools t ON b.tool_id = t.id
    WHERE ${whereSql}
  `;
  const [countRows] = await db.execute(countSql, params);
  const total = countRows[0].total;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, parseInt(page) || 1), totalPages);
  const offset = (safePage - 1) * limit;

  const sql = `
    SELECT b.*, u.username,
           t.name AS tool_name,
           (SELECT filename FROM tool_images WHERE tool_id = t.id ORDER BY created_at LIMIT 1) AS tool_image
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN tools  t ON b.tool_id = t.id
    WHERE ${whereSql}
    ORDER BY ${orderSql}
    LIMIT ${parseInt(limit)} OFFSET ${offset}
  `;
  const [rows] = await db.execute(sql, params);
  log.success(`Получено ${rows.length} из ${total} бронирований (страница ${safePage}/${totalPages})`);
  return {
    data: rows,
    total,
    page: safePage,
    limit: parseInt(limit),
    totalPages,
  };
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
