const bcrypt = require('bcryptjs');
const log = require('../utils/logger');
const userModel = require('../models/userModel');

const ROLES = ['admin', 'storekeeper', 'user'];
const ROLE_LABELS = { admin: 'Администратор', storekeeper: 'Кладовщик', user: 'Пользователь' };

async function users(req, res, next) {
  try {
    const allUsers = await userModel.getAll();
    const flash = req.session.flash || {};
    delete req.session.flash;
    res.render('admin/users', { allUsers, roles: ROLES, roleLabels: ROLE_LABELS, flash });
  } catch (err) { next(err); }
}

async function createUser(req, res, next) {
  try {
    const { username, password, role, first_name, last_name, gender, department, phone } = req.body;
    if (!username.trim() || !password || !ROLES.includes(role)) {
      log.warn(`Попытка создания пользователя с неверными данными: ${username}`);
      req.session.flash = { error: 'Заполните все поля корректно' };
      return res.redirect('/admin/users');
    }
    log.info(`Создание нового пользователя: ${username}, роль: ${role}`, { first_name, last_name, gender, department, phone });
    const hash = await bcrypt.hash(password, 10);
    await userModel.createWithProfile(username.trim(), hash, role, {
      first_name: first_name || null,
      last_name: last_name || null,
      gender: gender || null,
      department: department || null,
      phone: phone || null,
    });
    log.success(`Пользователь создан: ${username} (роль: ${role})`);
    req.session.flash = { success: `Пользователь «${username}» создан` };
    res.redirect('/admin/users');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      log.warn(`Попытка создать дубликат пользователя: ${username}`);
      req.session.flash = { error: 'Пользователь с таким именем уже существует' };
      return res.redirect('/admin/users');
    }
    next(err);
  }
}

async function changeRole(req, res, next) {
  try {
    if (String(req.params.id) === String(req.session.user.id)) {
      log.warn(`Попытка изменить собственную роль пользователем: ${req.session.user.username}`);
      req.session.flash = { error: 'Нельзя изменить собственную роль' };
      return res.redirect('/admin/users');
    }
    if (!ROLES.includes(req.body.role)) return res.redirect('/admin/users');
    log.info(`Изменение роли пользователя ${req.params.id} на: ${req.body.role} (выполнено ${req.session.user.username})`);
    await userModel.updateRole(req.params.id, req.body.role);
    log.success(`Роль пользователя ${req.params.id} изменена на: ${req.body.role}`);
    res.redirect('/admin/users');
  } catch (err) { next(err); }
}

async function removeUser(req, res, next) {
  try {
    if (String(req.params.id) === String(req.session.user.id)) {
      log.warn(`Попытка удалить собственный аккаунт пользователем: ${req.session.user.username}`);
      req.session.flash = { error: 'Нельзя удалить собственный аккаунт' };
      return res.redirect('/admin/users');
    }
    log.warn(`Удаление пользователя ${req.params.id} (выполнено ${req.session.user.username})`);
    await userModel.remove(req.params.id);
    log.success(`Пользователь удален: ${req.params.id}`);
    res.redirect('/admin/users');
  } catch (err) { next(err); }
}

module.exports = { users, createUser, changeRole, removeUser };
