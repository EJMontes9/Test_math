const User = require('./User');
const Paralelo = require('./Paralelo');
const Setting = require('./Setting');

// Definir asociaciones
Paralelo.belongsTo(User, {
  foreignKey: 'teacherId',
  as: 'teacher'
});

User.hasMany(Paralelo, {
  foreignKey: 'teacherId',
  as: 'paralelos'
});

module.exports = {
  User,
  Paralelo,
  Setting
};
