const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Paralelo = sequelize.define('Paralelo', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  level: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  teacherId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  studentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'paralelos',
});

// Método para obtener datos públicos
Paralelo.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  return values;
};

module.exports = Paralelo;
