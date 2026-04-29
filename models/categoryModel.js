const db = require('../config/db');

async function getAll() {
  const [rows] = await db.execute('SELECT * FROM categories ORDER BY name');
  return rows;
}

async function create(name) {
  const [result] = await db.execute('INSERT INTO categories (name) VALUES (?)', [name]);
  return result.insertId;
}

async function remove(id) {
  await db.execute('DELETE FROM categories WHERE id = ?', [id]);
}

module.exports = { getAll, create, remove };
