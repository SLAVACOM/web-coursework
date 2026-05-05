const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/toolController');
const { requireAuth, requireRole } = require('../middleware/auth');
const upload  = require('../middleware/upload');

const canEdit = requireRole('admin', 'storekeeper');

router.get('/api/tools',         requireAuth, ctrl.apiSearch);
router.get('/',                  requireAuth, ctrl.index);
router.get('/tools/new',         canEdit,     ctrl.newForm);
router.post('/tools',            canEdit,     upload.array('images', 10), ctrl.create);
router.get('/tools/:id',         requireAuth, ctrl.show);
router.get('/tools/:id/edit',    canEdit,     ctrl.editForm);
router.post('/tools/:id/update', canEdit,     upload.array('images', 10), ctrl.update);
router.post('/tools/:id/delete', canEdit,     ctrl.remove);
router.post('/tools/:id/images/:imageId/delete', canEdit, ctrl.removeImage);

module.exports = router;
