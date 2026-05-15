const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/login', ctrl.loginPage);
router.post('/login', ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/profile', requireAuth, ctrl.profile);
router.post('/profile/update', requireAuth, upload.single('photo'), ctrl.updateProfile);

module.exports = router;
