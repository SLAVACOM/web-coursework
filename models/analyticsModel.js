const log = require('../utils/logger');
const db = require('../config/db');

// Инструменты по категориям
async function toolsByCategory() {
  log.db('Получение статистики инструментов по категориям');
  const [rows] = await db.execute(`
    SELECT c.name, COUNT(t.id) as count, SUM(t.quantity) as total_quantity
    FROM categories c
    LEFT JOIN tools t ON c.id = t.category_id
    GROUP BY c.id, c.name
    ORDER BY count DESC
  `);
  return rows;
}

// Инструменты по состоянию
async function toolsByCondition() {
  log.db('Получение статистики инструментов по состоянию');
  const [rows] = await db.execute(`
    SELECT \`condition\`, COUNT(*) as count, SUM(quantity) as total_quantity
    FROM tools
    GROUP BY \`condition\`
    ORDER BY count DESC
  `);
  return rows;
}

// Общая стоимость инвентаря
async function inventoryValue() {
  log.db('Получение общей стоимости инвентаря');
  const [rows] = await db.execute(`
    SELECT
      COUNT(*) as total_tools,
      SUM(quantity) as total_quantity,
      SUM(price * quantity) as total_value
    FROM tools
  `);
  return rows[0];
}

// Инструменты с низким запасом (менее 5)
async function lowStockTools() {
  log.db('Получение инструментов с низким запасом');
  const [rows] = await db.execute(`
    SELECT t.id, t.name, t.quantity, c.name as category_name
    FROM tools t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.quantity < 5
    ORDER BY t.quantity ASC
  `);
  return rows;
}

// Статистика пользователей
async function userStats() {
  log.db('Получение статистики пользователей');
  const [rows] = await db.execute(`
    SELECT role, COUNT(*) as count
    FROM users
    GROUP BY role
    ORDER BY count DESC
  `);
  return rows;
}

// Статистика бронирований
async function bookingStats() {
  log.db('Получение статистики бронирований');
  const [rows] = await db.execute(`
    SELECT status, COUNT(*) as count
    FROM bookings
    GROUP BY status
  `);
  return rows;
}

// Самые популярные инструменты (по количеству бронирований)
async function popularTools() {
  log.db('Получение самых популярных инструментов');
  const [rows] = await db.execute(`
    SELECT t.name, COUNT(b.id) as booking_count
    FROM tools t
    LEFT JOIN bookings b ON t.id = b.tool_id
    GROUP BY t.id, t.name
    ORDER BY booking_count DESC
    LIMIT 10
  `);
  return rows;
}

// Статистика по месяцам (для графика активности)
async function monthlyActivity() {
  log.db('Получение статистики активности по месяцам');
  const [rows] = await db.execute(`
    SELECT
      DATE_FORMAT(created_at, '%Y-%m') as month,
      COUNT(*) as bookings_count
    FROM bookings
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY month DESC
    LIMIT 12
  `);
  return rows.reverse();
}

module.exports = {
  toolsByCategory,
  toolsByCondition,
  inventoryValue,
  lowStockTools,
  userStats,
  bookingStats,
  popularTools,
  monthlyActivity,
};
