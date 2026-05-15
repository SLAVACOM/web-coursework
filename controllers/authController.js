const bcrypt = require('bcryptjs');
const log = require('../utils/logger');
const userModel = require('../models/userModel');
const bookingModel = require('../models/bookingModel');

async function loginPage(req, res) {
  if (req.session.user) return res.redirect('/');
  res.render('login', { error: null });
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    log.auth(`Попытка входа: ${username}`);
    const user = await userModel.findByUsername(username.trim());
    if (!user || !(await bcrypt.compare(password, user.password.trim()))) {
      log.warn(`Неудачная попытка входа: ${username}`);
      return res.render('login', { error: 'Неверное имя пользователя или пароль' });
    }
    req.session.user = { id: user.id, username: user.username, role: user.role };
    log.success(`Успешный вход: ${username} (id: ${user.id}, роль: ${user.role})`);
    res.redirect('/');
  } catch (err) { next(err); }
}

function logout(req, res) {
  const username = req.session.user ? req.session.user.username : 'unknown';
  log.auth(`Выход пользователя: ${username}`);
  req.session.destroy(() => res.redirect('/login'));
}

async function profile(req, res, next) {
  try {
    log.info(`Загрузка профиля пользователя: ${req.session.user.username} (id: ${req.session.user.id})`);
    const user = await userModel.findById(req.session.user.id);
    if (!user) return res.redirect('/');
    const bookings = await bookingModel.getByUser(req.session.user.id);
    const statusLabels = {
      pending:  'Ожидает',
      approved: 'Одобрено',
      issued:   'Выдано',
      returned: 'Возвращено',
      rejected: 'Отклонено',
    };
    log.success(`Профиль загружен с ${bookings.length} бронированиями`);
    res.render('profile', { user, bookings, statusLabels });
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    const { first_name, last_name, gender, department, phone } = req.body;
    let photo = null;

    if (req.file) {
      photo = req.file.filename;
      log.info(`Загружено фото профиля: ${photo}`);
    }

    log.info(`Обновление профиля пользователя: ${req.session.user.username}`, { first_name, last_name, gender, department, phone });
    await userModel.updateProfile(req.session.user.id, {
      first_name,
      last_name,
      gender,
      department,
      phone,
      photo,
    });

    const updatedUser = await userModel.findById(req.session.user.id);
    req.session.user = { id: updatedUser.id, username: updatedUser.username, role: updatedUser.role };

    log.success(`Профиль обновлен: ${req.session.user.username}`);
    res.redirect('/profile');
  } catch (err) { next(err); }
}

module.exports = { loginPage, login, logout, profile, updateProfile };
