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
    const status = STATUSES.includes(req.query.status) ? req.query.status : undefined;
    const bookings = await bookingModel.getAll({ status });
    res.render('bookings/list', { bookings, statusLabels: STATUS_LABELS, filterStatus: status || '' });
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
    const tool = await toolModel.getById(tool_id);
    if (!tool) return res.status(404).render('404', { message: 'Инструмент не найден' });

    const activeQty = await bookingModel.getActiveQuantity(tool_id);
    const available = tool.quantity - activeQty;
    const qty = Number(quantity);

    if (qty < 1 || qty > available) {
      req.session.flash = { error: `Доступно только ${available} шт.` };
      return res.redirect(`/tools/${tool_id}`);
    }

    await bookingModel.create({ user_id: req.session.user.id, tool_id, quantity: qty, note });
    req.session.flash = { success: 'Заявка на бронирование отправлена' };
    res.redirect('/my-bookings');
  } catch (err) { next(err); }
}

// Кладовщик меняет статус
async function changeStatus(req, res, next) {
  try {
    const allowed = ['approved', 'issued', 'returned', 'rejected'];
    if (!allowed.includes(req.body.status)) return res.redirect('/bookings');
    await bookingModel.updateStatus(req.params.id, req.body.status);
    res.redirect('/bookings');
  } catch (err) { next(err); }
}

module.exports = { list, myBookings, create, changeStatus };
