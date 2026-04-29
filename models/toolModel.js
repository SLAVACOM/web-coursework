const db = require('../config/db');

async function getAll({ search, category_id } = {}) {
  let sql = `
    SELECT t.*, c.name AS category_name
    FROM tools t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ' AND (t.name LIKE ? OR t.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category_id) {
    sql += ' AND t.category_id = ?';
    params.push(category_id);
  }

  sql += ' ORDER BY t.name';
  const [rows] = await db.execute(sql, params);
  return rows;
}

async function getById(id) {
  const [rows] = await db.execute(
    `SELECT t.*, c.name AS category_name
     FROM tools t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.id = ?`,
    [id]
  );
  return rows[0];
}

async function create({ name, category_id, quantity, condition, purchase_date, price, description, image }) {
  const [result] = await db.execute(
    'INSERT INTO tools (name, category_id, quantity, `condition`, purchase_date, price, description, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, category_id || null, quantity || 1, condition, purchase_date || null, price || null, description || null, image || null]
  );
  return result.insertId;
}

async function update(id, { name, category_id, quantity, condition, purchase_date, price, description, image }) {
  if (image) {
    await db.execute(
      'UPDATE tools SET name=?, category_id=?, quantity=?, `condition`=?, purchase_date=?, price=?, description=?, image=? WHERE id=?',
      [name, category_id || null, quantity || 1, condition, purchase_date || null, price || null, description || null, image, id]
    );
  } else {
    await db.execute(
      'UPDATE tools SET name=?, category_id=?, quantity=?, `condition`=?, purchase_date=?, price=?, description=? WHERE id=?',
      [name, category_id || null, quantity || 1, condition, purchase_date || null, price || null, description || null, id]
    );
  }
}

async function remove(id) {
  await db.execute('DELETE FROM tools WHERE id = ?', [id]);
}

module.exports = { getAll, getById, create, update, remove };
