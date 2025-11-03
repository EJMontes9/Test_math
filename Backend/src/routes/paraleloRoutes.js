const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const paraleloController = require('../controllers/paraleloController');
const { authenticate, authorize } = require('../middleware/auth');

// Validaciones para crear paralelo
const createParaleloValidation = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('level').notEmpty().withMessage('El nivel es requerido'),
  body('teacherId').optional().isUUID().withMessage('ID de profesor inválido')
];

// Validaciones para actualizar paralelo
const updateParaleloValidation = [
  body('name').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('level').optional().notEmpty().withMessage('El nivel no puede estar vacío'),
  body('teacherId').optional().isUUID().withMessage('ID de profesor inválido')
];

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticate);
router.use(authorize('admin'));

// Rutas
router.get('/', paraleloController.getAllParalelos);
router.get('/stats', paraleloController.getParaleloStats);
router.get('/:id', paraleloController.getParaleloById);
router.post('/', createParaleloValidation, paraleloController.createParalelo);
router.put('/:id', updateParaleloValidation, paraleloController.updateParalelo);
router.delete('/:id', paraleloController.deleteParalelo);

module.exports = router;
