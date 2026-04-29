require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const DEFAULT_USERS = [
  { username: 'admin',  password: 'admin123',  role: 'admin' },
  { username: 'sklad',  password: 'sklad123',  role: 'storekeeper' },
  { username: 'guest',  password: 'guest123',  role: 'user' },
];

async function seed() {
  console.log('DB connected');
  for (const u of DEFAULT_USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    await db.execute(
      'INSERT IGNORE INTO users (username, password, role) VALUES (?, ?, ?)',
      [u.username, hash, u.role]
    );
    console.log(`✓ ${u.username} (${u.role})`);
  }
  console.log('Готово.');
}

seed().catch(err => { console.error(err); process.exit(1); });
