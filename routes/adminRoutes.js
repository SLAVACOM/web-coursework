const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { requireRole } = require('../middleware/auth');

router.use(requireRole('admin'));

router.get('/users', ctrl.users);
router.post('/users', ctrl.createUser);
router.post('/users/:id/role', ctrl.changeRole);
router.post('/users/:id/delete', ctrl.removeUser);

module.exports = router;
