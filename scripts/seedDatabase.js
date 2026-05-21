require('dotenv').config();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker/locale/ru');

const CONDITIONS = ['отличное', 'хорошее', 'удовлетворительное', 'плохое'];
const GENDERS = ['М', 'Ж', 'Другое'];
const DEPARTMENTS = ['Садоводство', 'Ландшафт', 'Техническое обслуживание', 'Администрация', 'Хранилище'];
const STATUSES = ['pending', 'approved', 'issued', 'returned', 'rejected'];

async function seedDatabase() {
  try {
    console.log('🌱 Начинаю заполнение БД...\n');

    // Очистка старых данных (опционально)
    console.log('🗑️  Очищаю старые данные...');
    await db.execute('DELETE FROM bookings');
    await db.execute('DELETE FROM tool_images');
    await db.execute('DELETE FROM tools');
    await db.execute('DELETE FROM users');
    console.log('✓ Таблицы очищены\n');

    // 1. Создаём пользователей
    console.log('👥 Создаю пользователей...');
    const users = [];
    const password = await bcrypt.hash('password123', 10);

    // Создаём супер-администратора
    let [result] = await db.execute(
      `INSERT INTO users (username, password, role, is_super_admin, first_name, last_name, gender, department, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['admin', password, 'admin', true, 'Администратор', 'Системы', 'М', 'Администрация', '+7 (999) 000-00-00']
    );
    users.push({ id: result.insertId, username: 'admin', firstName: 'Администратор', lastName: 'Системы' });

    // Создаём storekeeper
    [result] = await db.execute(
      `INSERT INTO users (username, password, role, first_name, last_name, gender, department, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['storekeeper', password, 'storekeeper', 'Кладовщик', 'Инвентаря', 'М', 'Хранилище', '+7 (999) 000-00-01']
    );
    users.push({ id: result.insertId, username: 'storekeeper', firstName: 'Кладовщик', lastName: 'Инвентаря' });

    // Создаём обычных пользователей
    for (let i = 0; i < 13; i++) {
      const username = faker.internet.userName().substring(0, 50);
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const gender = faker.helpers.arrayElement(GENDERS);
      const department = faker.helpers.arrayElement(DEPARTMENTS);
      const phone = '+7 (' + faker.string.numeric('9##') + ') ' + faker.string.numeric('###') + ' ' + faker.string.numeric('##') + '-' + faker.string.numeric('##');

      [result] = await db.execute(
        `INSERT INTO users (username, password, role, first_name, last_name, gender, department, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [username, password, 'user', firstName, lastName, gender, department, phone]
      );
      users.push({ id: result.insertId, username, firstName, lastName });
    }
    console.log(`✓ Создано ${users.length} пользователей\n`);

    // 2. Получаем категории (они уже есть в БД)
    console.log('📂 Получаю категории...');
    const [categories] = await db.execute('SELECT id FROM categories');
    console.log(`✓ Найдено ${categories.length} категорий\n`);

    // 3. Создаём инструменты
    console.log('🔧 Создаю инструменты...');
    const tools = [];
    const toolCount = 25;

    for (let i = 0; i < toolCount; i++) {
      const name = faker.word.noun() + ' ' + faker.word.adjective();
      const category_id = faker.helpers.arrayElement(categories).id;
      const quantity = faker.number.int({ min: 1, max: 20 });
      const condition = faker.helpers.arrayElement(CONDITIONS);
      const purchase_date = faker.date.past({ years: 3 });
      const price = faker.number.int({ min: 100, max: 5000 });
      const description = faker.lorem.sentence();

      const [result] = await db.execute(
        `INSERT INTO tools (name, category_id, quantity, \`condition\`, purchase_date, price, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, category_id, quantity, condition, purchase_date, price, description]
      );
      tools.push(result.insertId);
    }
    console.log(`✓ Создано ${toolCount} инструментов\n`);

    // 4. Создаём бронирования
    console.log('📋 Создаю бронирования...');
    const bookingCount = 40;

    for (let i = 0; i < bookingCount; i++) {
      const user_id = faker.helpers.arrayElement(users).id;
      const tool_id = faker.helpers.arrayElement(tools);
      const quantity = faker.number.int({ min: 1, max: 5 });
      const status = faker.helpers.arrayElement(STATUSES);
      const note = faker.datatype.boolean(0.6) ? faker.lorem.sentence() : null;
      const created_at = faker.date.recent({ days: 30 });

      await db.execute(
        `INSERT INTO bookings (user_id, tool_id, quantity, status, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, tool_id, quantity, status, note, created_at]
      );
    }
    console.log(`✓ Создано ${bookingCount} бронирований\n`);

    console.log('✅ Заполнение БД завершено успешно!');
    console.log('\n📝 Учётные данные для тестирования:');
    console.log('   Super Admin: admin / password123 (is_super_admin = true)');
    console.log('   Storekeeper: storekeeper / password123');
    console.log('\n📋 Созданные пользователи:');
    users.slice(2).forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.username} (${u.firstName} ${u.lastName}) / password123`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
  }
}

seedDatabase();
