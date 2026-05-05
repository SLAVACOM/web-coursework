const db = require('../config/db');

async function getAll({ search, category_id, condition, sort } = {}) {
  let sql = `
    SELECT t.*, c.name AS category_name,
           (SELECT filename FROM tool_images WHERE tool_id = t.id ORDER BY created_at LIMIT 1) AS image
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
  if (condition) {
    sql += ' AND t.`condition` = ?';
    params.push(condition);
  }

  if (sort === 'quantity') {
    sql += ' ORDER BY t.quantity DESC';
  } else if (sort === 'condition') {
    sql += ' ORDER BY FIELD(t.`condition`, "отличное", "хорошее", "удовлетворительное", "плохое") ASC';
  } else {
    sql += ' ORDER BY t.name ASC';
  }

  const [rows] = await db.execute(sql, params);
  return rows;
}

async function getById(id) {
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
