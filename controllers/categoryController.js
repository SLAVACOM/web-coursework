const categoryModel = require('../models/categoryModel');

async function index(req, res, next) {
  try {
    const categories = await categoryModel.getAll();
    res.render('categories', { categories });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    await categoryModel.create(req.body.name.trim());
    res.redirect('/categories');
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await categoryModel.remove(req.params.id);
    res.redirect('/categories');
  } catch (err) { next(err); }
}

module.exports = { index, create, remove };
