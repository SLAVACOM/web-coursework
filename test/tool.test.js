require('dotenv').config();
const { expect } = require('chai');

const db             = require('../config/db');
const toolModel      = require('../models/toolModel');
const categoryModel  = require('../models/categoryModel');

const PREFIX = 'TEST_';

after(async () => {
  await db.execute("DELETE FROM tools       WHERE name LIKE 'TEST_%'");
  await db.execute("DELETE FROM categories  WHERE name LIKE 'TEST_%'");
  await db.end();
});

describe('CategoryModel', () => {
  let catId;

  it('getAll() возвращает массив', async () => {
    const rows = await categoryModel.getAll();
    expect(rows).to.be.an('array');
  });

  it('create() добавляет категорию', async () => {
    catId = await categoryModel.create(PREFIX + 'Категория');
    expect(catId).to.be.a('number').and.greaterThan(0);
  });

  it('remove() удаляет категорию', async () => {
    await categoryModel.remove(catId);
    const rows = await categoryModel.getAll();
    expect(rows.find(c => c.id === catId)).to.be.undefined;
  });
});

describe('ToolModel', () => {
  let catId, toolId;

  before(async () => {
    catId = await categoryModel.create(PREFIX + 'Cat');
  });

  it('create() добавляет инструмент', async () => {
    toolId = await toolModel.create({
      name:          PREFIX + 'Лопата',
      category_id:   catId,
      quantity:      3,
      condition:     'хорошее',
      purchase_date: '2024-01-15',
      price:         750,
      description:   'Тестовая лопата',
    });
    expect(toolId).to.be.a('number').and.greaterThan(0);
  });

  it('getAll() содержит новый инструмент', async () => {
    const rows = await toolModel.getAll();
    expect(rows.some(t => t.id === toolId)).to.be.true;
  });

  it('getAll() с поиском фильтрует результаты', async () => {
    const rows = await toolModel.getAll({ search: PREFIX + 'Лопата' });
    expect(rows.every(t => t.name.includes(PREFIX))).to.be.true;
  });

  it('getAll() с category_id фильтрует по категории', async () => {
    const rows = await toolModel.getAll({ category_id: catId });
    expect(rows.every(t => t.category_id === catId)).to.be.true;
  });

  it('getById() возвращает инструмент', async () => {
    const tool = await toolModel.getById(toolId);
    expect(tool.name).to.equal(PREFIX + 'Лопата');
    expect(tool.quantity).to.equal(3);
  });

  it('update() обновляет поля', async () => {
    await toolModel.update(toolId, {
      name:          PREFIX + 'Лопата',
      category_id:   catId,
      quantity:      10,
      condition:     'отличное',
      purchase_date: '2024-06-01',
      price:         900,
      description:   'Обновлено',
    });
    const tool = await toolModel.getById(toolId);
    expect(tool.quantity).to.equal(10);
    expect(tool.condition).to.equal('отличное');
  });

  it('getById() возвращает undefined для несуществующего id', async () => {
    const tool = await toolModel.getById(9999999);
    expect(tool).to.be.undefined;
  });

  it('remove() удаляет инструмент', async () => {
    await toolModel.remove(toolId);
    expect(await toolModel.getById(toolId)).to.be.undefined;
  });
});
