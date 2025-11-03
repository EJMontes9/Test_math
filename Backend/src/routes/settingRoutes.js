const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticate);
router.use(authorize('admin'));

// Rutas
router.get('/', settingController.getAllSettings);
router.get('/:key', settingController.getSetting);
router.put('/:key', settingController.updateSetting);
router.post('/bulk', settingController.updateMultipleSettings);
router.post('/initialize', settingController.initializeDefaults);
router.post('/upload-logo', upload.single('logo'), settingController.uploadLogo);

module.exports = router;
