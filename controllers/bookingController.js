const log = require('../utils/logger');
const bookingModel = require('../models/bookingModel');
const toolModel    = require('../models/toolModel');

const STATUS_LABELS = {
  pending:  'Ожидает',
  approved: 'Одобрено',
  issued:   'Выдано',
  returned: 'Возвращено',
  rejected: 'Отклонено',
};
const STATUSES = Object.keys(STATUS_LABELS);

// Кладовщик/Админ: все заявки
async function list(req, res, next) {
  try {
    const ALLOWED_SORTS = ['date_desc', 'date_asc', 'status', 'user', 'tool', 'quantity'];
    const ALLOWED_LIMITS = [10, 25, 50, 100];

    const status = STATUSES.includes(req.query.status) ? req.query.status : undefined;
    const search = (req.query.search || '').trim();
    const sort   = ALLOWED_SORTS.includes(req.query.sort) ? req.query.sort : 'date_desc';
    const limit  = ALLOWED_LIMITS.includes(parseInt(req.query.limit)) ? parseInt(req.query.limit) : 10;
    const page   = Math.max(1, parseInt(req.query.page) || 1);

    const result = await bookingModel.getAll({ status, search, sort, page, limit });

    res.render('bookings/list', {
      bookings: result.data,
      statusLabels: STATUS_LABELS,
      filterStatus: status || '',
      search,
      sort,
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (err) { next(err); }
}

// Пользователь: история своих заявок
async function myBookings(req, res, next) {
  try {
    const status = STATUSES.includes(req.query.status) ? req.query.status : undefined;
    const bookings = await bookingModel.getByUser(req.session.user.id, { status });
    res.render('bookings/my', { bookings, statusLabels: STATUS_LABELS, filterStatus: status || '' });
  } catch (err) { next(err); }
}

// Создать заявку на бронирование
async function create(req, res, next) {
  try {
    const { tool_id, quantity, note } = req.body;
    log.booking(`Новая заявка на бронирование от ${req.session.user.username} на инструмент ${tool_id}, количество: ${quantity}`);
    const tool = await toolModel.getById(tool_id);
    if (!tool) return res.status(404).render('404', { message: 'Инструмент не найден' });

    const activeQty = await bookingModel.getActiveQuantity(tool_id);
    const available = tool.quantity - activeQty;
    const qty = Number(quantity);

    if (qty < 1 || qty > available) {
      log.warn(`Отклонено: недостаточно количества. Доступно: ${available}, запрошено: ${qty}`);
      req.session.flash = { error: `Доступно только ${available} шт.` };
      return res.redirect(`/tools/${tool_id}`);
    }

    await bookingModel.create({ user_id: req.session.user.id, tool_id, quantity: qty, note });
    log.success(`Заявка на бронирование создана: пользователь ${req.session.user.username}, инструмент ${tool_id}, количество ${qty}`);
    req.session.flash = { success: 'Заявка на бронирование отправлена' };
    res.redirect('/my-bookings');
  } catch (err) { next(err); }
}

// Кладовщик меняет статус
async function changeStatus(req, res, next) {
  try {
    const allowed = ['approved', 'issued', 'returned', 'rejected'];
    if (!allowed.includes(req.body.status)) return res.redirect('/bookings');
    log.booking(`Изменение статуса заявки ${req.params.id}: ${req.body.status} (выполнено ${req.session.user.username})`);
    await bookingModel.updateStatus(req.params.id, req.body.status);
    log.success(`Статус заявки ${req.params.id} изменен на: ${req.body.status}`);
    res.redirect('/bookings');
  } catch (err) { next(err); }
}

module.exports = { list, myBookings, create, changeStatus };
