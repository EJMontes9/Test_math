const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Validaciones para crear usuario
const createUserValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('firstName').notEmpty().withMessage('El nombre es requerido'),
  body('lastName').notEmpty().withMessage('El apellido es requerido'),
  body('role').optional().isIn(['admin', 'teacher', 'student']).withMessage('Rol inválido')
];

// Validaciones para actualizar usuario
const updateUserValidation = [
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('password').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('firstName').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('lastName').optional().notEmpty().withMessage('El apellido no puede estar vacío'),
  body('role').optional().isIn(['admin', 'teacher', 'student']).withMessage('Rol inválido')
];

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticate);
router.use(authorize('admin'));

// Rutas
router.get('/', userController.getAllUsers);
router.get('/stats', userController.getUserStats);
router.get('/:id', userController.getUserById);
router.post('/', createUserValidation, userController.createUser);
router.put('/:id', updateUserValidation, userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
