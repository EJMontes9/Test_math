const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    defaultValue: 'string',
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'settings',
});

module.exports = Setting;
