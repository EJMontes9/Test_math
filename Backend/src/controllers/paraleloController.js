const { Paralelo, User } = require('../models');
const { validationResult } = require('express-validator');
const sequelize = require('../config/database');

// Obtener todos los paralelos
exports.getAllParalelos = async (req, res) => {
  try {
    const { search, status } = req.query;

    let whereClause = {};

    // Filtro por estado
    if (status) {
      whereClause.isActive = status === 'active';
    }

    // Búsqueda por nombre o nivel
    if (search) {
      const { Op } = require('sequelize');
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { level: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const paralelos = await Paralelo.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'teacher',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: paralelos
    });
  } catch (error) {
    console.error('Error al obtener paralelos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener paralelos',
      error: error.message
    });
  }
};

// Obtener un paralelo por ID
exports.getParaleloById = async (req, res) => {
  try {
    const { id } = req.params;

    const paralelo = await Paralelo.findByPk(id, {
      include: [{
        model: User,
        as: 'teacher',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    if (!paralelo) {
      return res.status(404).json({
        success: false,
        message: 'Paralelo no encontrado'
      });
    }

    res.json({
      success: true,
      data: paralelo
    });
  } catch (error) {
    console.error('Error al obtener paralelo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener paralelo',
      error: error.message
    });
  }
};

// Crear un nuevo paralelo
exports.createParalelo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const { name, level, teacherId, description } = req.body;

    // Verificar que el profesor existe si se proporciona
    if (teacherId) {
      const teacher = await User.findByPk(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(400).json({
          success: false,
          message: 'El profesor especificado no existe o no tiene rol de docente'
        });
      }
    }

    const paralelo = await Paralelo.create({
      name,
      level,
      teacherId: teacherId || null,
      description,
      studentCount: 0,
      isActive: true
    });

    // Obtener el paralelo con el teacher incluido
    const paraleloWithTeacher = await Paralelo.findByPk(paralelo.id, {
      include: [{
        model: User,
        as: 'teacher',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Paralelo creado exitosamente',
      data: paraleloWithTeacher
    });
  } catch (error) {
    console.error('Error al crear paralelo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear paralelo',
      error: error.message
    });
  }
};

// Actualizar paralelo
exports.updateParalelo = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, level, teacherId, description, isActive } = req.body;

    const paralelo = await Paralelo.findByPk(id);

    if (!paralelo) {
      return res.status(404).json({
        success: false,
        message: 'Paralelo no encontrado'
      });
    }

    // Verificar que el profesor existe si se proporciona
    if (teacherId) {
      const teacher = await User.findByPk(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(400).json({
          success: false,
          message: 'El profesor especificado no existe o no tiene rol de docente'
        });
      }
    }

    // Actualizar campos
    const updateData = {};
    if (name) updateData.name = name;
    if (level) updateData.level = level;
    if (teacherId !== undefined) updateData.teacherId = teacherId;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    await paralelo.update(updateData);

    // Obtener el paralelo actualizado con el teacher
    const updatedParalelo = await Paralelo.findByPk(id, {
      include: [{
        model: User,
        as: 'teacher',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    res.json({
      success: true,
      message: 'Paralelo actualizado exitosamente',
      data: updatedParalelo
    });
  } catch (error) {
    console.error('Error al actualizar paralelo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar paralelo',
      error: error.message
    });
  }
};

// Eliminar paralelo (soft delete)
exports.deleteParalelo = async (req, res) => {
  try {
    const { id } = req.params;

    const paralelo = await Paralelo.findByPk(id);

    if (!paralelo) {
      return res.status(404).json({
        success: false,
        message: 'Paralelo no encontrado'
      });
    }

    // Soft delete - desactivar paralelo
    await paralelo.update({ isActive: false });

    res.json({
      success: true,
      message: 'Paralelo eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar paralelo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar paralelo',
      error: error.message
    });
  }
};

// Obtener estadísticas de paralelos
exports.getParaleloStats = async (req, res) => {
  try {
    const totalParalelos = await Paralelo.count();
    const activeParalelos = await Paralelo.count({ where: { isActive: true } });
    const inactiveParalelos = await Paralelo.count({ where: { isActive: false } });

    // Total de estudiantes (suma de studentCount)
    const result = await Paralelo.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('student_count')), 'totalStudents']
      ],
      where: { isActive: true },
      raw: true
    });

    const totalStudents = parseInt(result[0]?.totalStudents || 0);

    res.json({
      success: true,
      data: {
        total: totalParalelos,
        active: activeParalelos,
        inactive: inactiveParalelos,
        totalStudents: parseInt(totalStudents)
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
