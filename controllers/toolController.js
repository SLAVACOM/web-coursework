const toolModel    = require('../models/toolModel');
const categoryModel = require('../models/categoryModel');
const bookingModel  = require('../models/bookingModel');

const CONDITIONS = ['отличное', 'хорошее', 'удовлетворительное', 'плохое'];

async function index(req, res, next) {
  try {
    const { search = '', category_id = '', condition = '', sort = '' } = req.query;
    const [tools, categories] = await Promise.all([
      toolModel.getAll({ search, category_id, condition, sort }),
      categoryModel.getAll(),
    ]);
    res.render('index', { tools, categories, search, category_id, condition, sort });
  } catch (err) { next(err); }
}

async function show(req, res, next) {
  try {
    const tool = await toolModel.getById(req.params.id);
    if (!tool) return res.status(404).render('404', { message: 'Инструмент не найден' });

    const activeQty    = await bookingModel.getActiveQuantity(req.params.id);
    const availableQty = tool.quantity - activeQty;

    const flash = req.session.flash || {};
    delete req.session.flash;

    res.render('detail', { tool, availableQty, flash });
  } catch (err) { next(err); }
}

async function newForm(req, res, next) {
  try {
    const categories = await categoryModel.getAll();
    res.render('form', { tool: null, categories, conditions: CONDITIONS });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const id = await toolModel.create(req.body);

    if (req.files && req.files.length) {
      for (const file of req.files) {
        await toolModel.addImage(id, file.filename);
      }
    }

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
    res.render('form', { tool, categories, conditions: CONDITIONS });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    await toolModel.update(req.params.id, req.body);

    if (req.files && req.files.length) {
      for (const file of req.files) {
        await toolModel.addImage(req.params.id, file.filename);
      }
    }

    res.redirect(`/tools/${req.params.id}`);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await toolModel.remove(req.params.id);
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
