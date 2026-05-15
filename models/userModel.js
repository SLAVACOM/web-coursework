const log = require('../utils/logger');
const db = require('../config/db');

async function findByUsername(username) {
  log.db(`Поиск пользователя по имени: ${username}`);
  const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
  if (rows[0]) log.success(`Пользователь найден: ${username}`);
  return rows[0];
}

async function findById(id) {
  log.db(`Получение данных пользователя по id: ${id}`);
  const [rows] = await db.execute(
    'SELECT id, username, role, first_name, last_name, gender, department, phone, photo, created_at FROM users WHERE id = ?',
    [id]
  );
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

async function createWithProfile(username, passwordHash, role, { first_name, last_name, gender, department, phone }) {
  const [result] = await db.execute(
    'INSERT INTO users (username, password, role, first_name, last_name, gender, department, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [username, passwordHash, role, first_name, last_name, gender, department, phone]
  );
  return result.insertId;
}

async function updateRole(id, role) {
  await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
}

async function remove(id) {
  await db.execute('DELETE FROM users WHERE id = ?', [id]);
}

async function updateProfile(id, { first_name, last_name, gender, department, phone, photo }) {
  await db.execute(
    `UPDATE users SET first_name = ?, last_name = ?, gender = ?, department = ?, phone = ?, photo = ? WHERE id = ?`,
    [first_name || null, last_name || null, gender || null, department || null, phone || null, photo || null, id]
  );
}

module.exports = { findByUsername, findById, getAll, create, createWithProfile, updateRole, remove, updateProfile };
