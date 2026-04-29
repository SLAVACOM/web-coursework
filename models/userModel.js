const db = require('../config/db');

async function findByUsername(username) {
  const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0];
}

async function getAll() {
  const [rows] = await db.execute(
    'SELECT id, username, role, created_at FROM users ORDER BY id'
  );
  return rows;
}

async function create(username, passwordHash, role) {
  const [result] = await db.execute(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    [username, passwordHash, role]
  );
  return result.insertId;
}

async function updateRole(id, role) {
  await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
}

async function remove(id) {
  await db.execute('DELETE FROM users WHERE id = ?', [id]);
}

module.exports = { findByUsername, getAll, create, updateRole, remove };
