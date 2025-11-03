const User = require('../models/User');
const { validationResult } = require('express-validator');

// Obtener todos los usuarios con filtros
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;

    let whereClause = {};

    // Filtro por rol
    if (role && ['admin', 'teacher', 'student'].includes(role)) {
      whereClause.role = role;
    }

    // Filtro por estado
    if (status) {
      whereClause.isActive = status === 'active';
    }

    // Búsqueda por nombre o email
    if (search) {
      const { Op } = require('sequelize');
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const users = await User.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

// Obtener un usuario por ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

// Crear un nuevo usuario
exports.createUser = async (req, res) => {
  try {
    // Validar errores
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, role, isActive } = req.body;

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Crear usuario
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: role || 'student',
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: user
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message
    });
  }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, firstName, lastName, role, isActive } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Si se está actualizando el email, verificar que no exista
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }
    }

    // Actualizar campos
    const updateData = {};
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    await user.update(updateData);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: user
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

// Eliminar usuario (soft delete)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Soft delete - desactivar usuario
    await user.update({ isActive: false });

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    });
  }
};

// Obtener estadísticas de usuarios
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const inactiveUsers = await User.count({ where: { isActive: false } });

    const adminCount = await User.count({ where: { role: 'admin', isActive: true } });
    const teacherCount = await User.count({ where: { role: 'teacher', isActive: true } });
    const studentCount = await User.count({ where: { role: 'student', isActive: true } });

    res.json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        byRole: {
          admin: adminCount,
          teacher: teacherCount,
          student: studentCount
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};
