const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

async function loginPage(req, res) {
  if (req.session.user) return res.redirect('/');
  res.render('login', { error: null });
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const user = await userModel.findByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('login', { error: 'Неверное имя пользователя или пароль' });
    }
    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.redirect('/');
  } catch (err) { next(err); }
}

function logout(req, res) {
  req.session.destroy(() => res.redirect('/login'));
}

module.exports = { loginPage, login, logout };
