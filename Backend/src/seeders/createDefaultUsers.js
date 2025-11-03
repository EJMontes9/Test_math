const sequelize = require('../config/database');
const User = require('../models/User');

const defaultUsers = [
  {
    email: 'admin@mathmaster.com',
    password: 'Admin123!',
    firstName: 'Administrador',
    lastName: 'Sistema',
    role: 'admin',
    isActive: true,
  },
  {
    email: 'docente@mathmaster.com',
    password: 'Docente123!',
    firstName: 'Profesor',
    lastName: 'Demo',
    role: 'teacher',
    isActive: true,
  },
  {
    email: 'estudiante@mathmaster.com',
    password: 'Estudiante123!',
    firstName: 'Estudiante',
    lastName: 'Demo',
    role: 'student',
    isActive: true,
  },
];

const seedUsers = async () => {
  try {
    // Sincronizar base de datos
    await sequelize.sync({ force: true });
    console.log('✅ Base de datos sincronizada');

    // Crear usuarios
    for (const userData of defaultUsers) {
      const user = await User.create(userData);
      console.log(`✅ Usuario creado: ${user.email} (${user.role})`);
    }

    console.log('\n🎉 Usuarios por defecto creados exitosamente!\n');
    console.log('='.repeat(60));
    console.log('📋 CREDENCIALES DE ACCESO:');
    console.log('='.repeat(60));
    console.log('\n👨‍💼 ADMINISTRADOR:');
    console.log('   Email: admin@mathmaster.com');
    console.log('   Contraseña: Admin123!');
    console.log('\n👩‍🏫 DOCENTE:');
    console.log('   Email: docente@mathmaster.com');
    console.log('   Contraseña: Docente123!');
    console.log('\n👨‍🎓 ESTUDIANTE:');
    console.log('   Email: estudiante@mathmaster.com');
    console.log('   Contraseña: Estudiante123!');
    console.log('\n' + '='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuarios:', error);
    process.exit(1);
  }
};

seedUsers();
