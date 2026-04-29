const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/bookingController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/bookings',    requireRole('admin', 'storekeeper'), ctrl.list);
router.get('/my-bookings', requireAuth,                         ctrl.myBookings);
router.post('/bookings',   requireAuth,                         ctrl.create);
router.post('/bookings/:id/status', requireRole('admin', 'storekeeper'), ctrl.changeStatus);

module.exports = router;
