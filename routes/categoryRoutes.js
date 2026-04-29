const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/categoryController');
const { requireRole } = require('../middleware/auth');

router.use(requireRole('admin', 'storekeeper'));

router.get('/', ctrl.index);
router.post('/', ctrl.create);
router.post('/:id/delete', ctrl.remove);

module.exports = router;
