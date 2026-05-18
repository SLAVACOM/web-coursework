const log = require('../utils/logger');
const toolModel    = require('../models/toolModel');
const categoryModel = require('../models/categoryModel');
const bookingModel  = require('../models/bookingModel');

const CONDITIONS = ['отличное', 'хорошее', 'удовлетворительное', 'плохое'];

async function index(req, res, next) {
  try {
    const { search = '', category_id = '', condition = '', sort = '', page = 1, limit = 12 } = req.query;
    const [result, categories] = await Promise.all([
      toolModel.getAll({ search, category_id, condition, sort, page: parseInt(page), limit: parseInt(limit) }),
      categoryModel.getAll(),
    ]);
    res.render('index', {
      tools: result.data,
      categories,
      search,
      category_id,
      condition,
      sort,
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (err) { next(err); }
}

async function show(req, res, next) {
  try {
    const tool = await toolModel.getById(req.params.id);
    if (!tool) return res.status(404).render('404', { message: 'Инструмент не найден' });

    const activeQty    = await bookingModel.getActiveQuantity(req.params.id);
    const availableQty = Math.max(0, tool.quantity - activeQty);

    const flash = req.session.flash || {};
    delete req.session.flash;

    res.render('detail', { tool, availableQty, flash });
  } catch (err) { next(err); }
}

async function newForm(req, res, next) {
  try {
    const categories = await categoryModel.getAll();
    res.render('form', { tool: null, categories, conditions: CONDITIONS, flash: {} });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    log.tool(`Создание нового инструмента: ${req.body.name}`, { quantity: req.body.quantity, condition: req.body.condition });
    const id = await toolModel.create(req.body);

    if (req.files && req.files.length) {
      log.tool(`Добавление ${req.files.length} фотографий к инструменту ${id}`);
      for (const file of req.files) {
        await toolModel.addImage(id, file.filename);
      }
    }

    log.success(`Инструмент создан: ${req.body.name} (id: ${id})`);
    res.redirect(`/tools/${id}`);
  } catch (err) { next(err); }
}

async function editForm(req, res, next) {
  try {
    const [tool, categories] = await Promise.all([
      toolModel.getById(req.params.id),
      categoryModel.getAll(),
    ]);
    if (!tool) return res.status(404).render('404', { message: 'Инструмент не найден' });
    const flash = req.session.flash || {};
    delete req.session.flash;
    res.render('form', { tool, categories, conditions: CONDITIONS, flash });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    log.tool(`Обновление инструмента: ${req.params.id}`);
    const newQty = Number(req.body.quantity) || 1;
    const activeQty = await bookingModel.getActiveQuantity(req.params.id);
    if (newQty < activeQty) {
      log.warn(`Попытка установить количество (${newQty}) меньше активных бронирований (${activeQty})`);
      req.session.flash = { error: `Нельзя установить количество меньше активных бронирований (${activeQty} шт.)` };
      return res.redirect(`/tools/${req.params.id}/edit`);
    }
    await toolModel.update(req.params.id, req.body);

    if (req.body.deleted_images) {
      const fs = require('fs');
      const path = require('path');
      const imageIds = req.body.deleted_images.split(',');
      log.tool(`Удаление ${imageIds.length} фотографий из инструмента ${req.params.id}`);
      for (const imageId of imageIds) {
        const filename = await toolModel.removeImage(imageId);
        if (filename) {
          fs.unlink(path.join(__dirname, '../public/uploads/', filename), () => {});
        }
      }
    }

    if (req.files && req.files.length) {
      log.tool(`Добавление ${req.files.length} новых фотографий к инструменту ${req.params.id}`);
      for (const file of req.files) {
        await toolModel.addImage(req.params.id, file.filename);
      }
    }

    log.success(`Инструмент обновлен: ${req.params.id}`);
    res.redirect(`/tools/${req.params.id}`);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    log.warn(`Удаление инструмента: ${req.params.id}`);
    await toolModel.remove(req.params.id);
    log.success(`Инструмент удален: ${req.params.id}`);
    res.redirect('/');
  } catch (err) { next(err); }
}

async function removeImage(req, res, next) {
  try {
    const filename = await toolModel.removeImage(req.params.imageId);
    if (filename) {
      const fs = require('fs');
      const path = require('path');
      fs.unlink(path.join(__dirname, '../public/uploads/', filename), () => {});
    }
    res.redirect(`/tools/${req.params.id}`);
  } catch (err) { next(err); }
}

async function apiSearch(req, res, next) {
  try {
    const tools = await toolModel.getAll(req.query);
    res.json(tools);
  } catch (err) { next(err); }
}

module.exports = { index, show, newForm, create, editForm, update, remove, removeImage, apiSearch };
