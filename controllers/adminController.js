const bcrypt = require('bcryptjs');
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
    const { username, password, role } = req.body;
    if (!username.trim() || !password || !ROLES.includes(role)) {
      req.session.flash = { error: 'Заполните все поля корректно' };
      return res.redirect('/admin/users');
    }
    const hash = await bcrypt.hash(password, 10);
    await userModel.create(username.trim(), hash, role);
    req.session.flash = { success: `Пользователь «${username}» создан` };
    res.redirect('/admin/users');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      req.session.flash = { error: 'Пользователь с таким именем уже существует' };
      return res.redirect('/admin/users');
    }
    next(err);
  }
}

async function changeRole(req, res, next) {
  try {
    if (String(req.params.id) === String(req.session.user.id)) {
      req.session.flash = { error: 'Нельзя изменить собственную роль' };
      return res.redirect('/admin/users');
    }
    if (!ROLES.includes(req.body.role)) return res.redirect('/admin/users');
    await userModel.updateRole(req.params.id, req.body.role);
    res.redirect('/admin/users');
  } catch (err) { next(err); }
}

async function removeUser(req, res, next) {
  try {
    if (String(req.params.id) === String(req.session.user.id)) {
      req.session.flash = { error: 'Нельзя удалить собственный аккаунт' };
      return res.redirect('/admin/users');
    }
    await userModel.remove(req.params.id);
    res.redirect('/admin/users');
  } catch (err) { next(err); }
}

module.exports = { users, createUser, changeRole, removeUser };
