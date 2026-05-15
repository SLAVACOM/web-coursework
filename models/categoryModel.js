const log = require('../utils/logger');
const db = require('../config/db');

async function getAll() {
  log.db(`Получение списка категорий`);
  const [rows] = await db.execute('SELECT * FROM categories ORDER BY name');
  log.success(`Получено ${rows.length} категорий`);
  return rows;
}

async function create(name) {
  log.db(`Создание новой категории: ${name}`);
  const [result] = await db.execute('INSERT INTO categories (name) VALUES (?)', [name]);
  log.success(`Категория создана: ${name} (id: ${result.insertId})`);
  return result.insertId;
}

async function remove(id) {
  log.db(`Удаление категории: ${id}`);
  await db.execute('DELETE FROM categories WHERE id = ?', [id]);
  log.success(`Категория удалена: ${id}`);
}

module.exports = { getAll, create, remove };
