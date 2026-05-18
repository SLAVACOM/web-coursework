const log = require('../utils/logger');
const db = require('../config/db');

async function getAll({ search, category_id, condition, sort, page = 1, limit = 12 } = {}) {
  log.db(`Получение списка инструментов`, { search, category_id, condition, sort, page, limit });

  let baseSql = `
    SELECT t.*, c.name AS category_name,
           (SELECT filename FROM tool_images WHERE tool_id = t.id ORDER BY created_at LIMIT 1) AS image
    FROM tools t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    baseSql += ' AND (t.name LIKE ? OR t.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category_id) {
    baseSql += ' AND t.category_id = ?';
    params.push(category_id);
  }
  if (condition) {
    baseSql += ' AND t.`condition` = ?';
    params.push(condition);
  }

  if (sort === 'quantity') {
    baseSql += ' ORDER BY t.quantity DESC';
  } else if (sort === 'condition') {
    baseSql += ' ORDER BY FIELD(t.`condition`, "отличное", "хорошее", "удовлетворительное", "плохое") ASC';
  } else {
    baseSql += ' ORDER BY t.name ASC';
  }

  // Подсчет всего
  const countSql = `SELECT COUNT(*) as total FROM tools t LEFT JOIN categories c ON t.category_id = c.id WHERE 1=1` +
    (search ? ' AND (t.name LIKE ? OR t.description LIKE ?)' : '') +
    (category_id ? ' AND t.category_id = ?' : '') +
    (condition ? ' AND t.`condition` = ?' : '');

  const [countResult] = await db.execute(countSql, params.slice());
  const total = countResult[0].total;
  const totalPages = Math.ceil(total / limit);

  // Пагинация
  const offset = (page - 1) * limit;
  const paginatedSql = baseSql + ` LIMIT ${limit} OFFSET ${offset}`;

  const [rows] = await db.execute(paginatedSql, params);

  log.success(`Получено ${rows.length} из ${total} инструментов (страница ${page}/${totalPages})`);
  return {
    data: rows,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
  };
}

async function getById(id) {
  log.db(`Получение инструмента по id: ${id}`);
  const [toolRows] = await db.execute(
    `SELECT t.*, c.name AS category_name
     FROM tools t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.id = ?`,
    [id]
  );
  const tool = toolRows[0];
  if (!tool) return null;

  const [imageRows] = await db.execute(
    `SELECT id, filename FROM tool_images WHERE tool_id = ? ORDER BY created_at ASC`,
    [id]
  );
  tool.images = imageRows;
  log.success(`Инструмент ${id} загружен с ${imageRows.length} изображениями`);
  return tool;
}

async function create({ name, category_id, quantity, condition, purchase_date, price, description }) {
  const [result] = await db.execute(
    'INSERT INTO tools (name, category_id, quantity, `condition`, purchase_date, price, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, category_id || null, quantity || 1, condition, purchase_date || null, price || null, description || null]
  );
  return result.insertId;
}

async function update(id, { name, category_id, quantity, condition, purchase_date, price, description }) {
  await db.execute(
    'UPDATE tools SET name=?, category_id=?, quantity=?, `condition`=?, purchase_date=?, price=?, description=? WHERE id=?',
    [name, category_id || null, quantity || 1, condition, purchase_date || null, price || null, description || null, id]
  );
}

async function remove(id) {
  await db.execute('DELETE FROM tools WHERE id = ?', [id]);
}

async function addImage(tool_id, filename) {
  const [result] = await db.execute(
    'INSERT INTO tool_images (tool_id, filename) VALUES (?, ?)',
    [tool_id, filename]
  );
  return result.insertId;
}

async function removeImage(image_id) {
  const [imageRows] = await db.execute('SELECT filename FROM tool_images WHERE id = ?', [image_id]);
  if (!imageRows.length) return null;

  const filename = imageRows[0].filename;
  await db.execute('DELETE FROM tool_images WHERE id = ?', [image_id]);
  return filename;
}

module.exports = { getAll, getById, create, update, remove, addImage, removeImage };
