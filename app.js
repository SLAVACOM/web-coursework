require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path    = require('path');

const log = require('./utils/logger');

const authRoutes    = require('./routes/authRoutes');
const toolRoutes    = require('./routes/toolRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

log.info('Инициализация приложения');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'garden_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;

  const user = req.session.user ? req.session.user.username : 'guest';
  log.http(req.method, req.path, 'processing', user);

  const originalSend = res.send;
  res.send = function(data) {
    log.http(req.method, req.path, res.statusCode, user);
    return originalSend.call(this, data);
  };

  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/',           authRoutes);
app.use('/',           toolRoutes);
app.use('/',           bookingRoutes);
app.use('/categories', categoryRoutes);
app.use('/admin',      adminRoutes);

app.use((req, res) => res.status(404).render('404', { message: 'Страница не найдена' }));

app.use((err, req, res, next) => {
  log.error('Необработанная ошибка', { message: err.message, path: req.path, stack: err.stack });
  res.status(500).render('404', { message: 'Внутренняя ошибка сервера' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  log.success(`Сервер запущен: http://localhost:${PORT}`);
});

module.exports = app;
