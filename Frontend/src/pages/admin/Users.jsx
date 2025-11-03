import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import userService from '../../services/userService';
import UserModal from '../../components/modals/UserModal';
import ConfirmModal from '../../components/modals/ConfirmModal';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [error, setError] = useState('');

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const filters = {
        role: roleFilter,
        status: statusFilter,
        search: searchTerm
      };
      const response = await userService.getAllUsers(filters);
      if (response.success) {
        setUsers(response.data);
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  // Buscar con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsConfirmOpen(true);
  };

  const handleSaveUser = async (userData) => {
    try {
      if (selectedUser) {
        // Actualizar
        await userService.updateUser(selectedUser.id, userData);
      } else {
        // Crear
        await userService.createUser(userData);
      }
      loadUsers();
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await userService.deleteUser(userToDelete.id);
      setIsConfirmOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      setError('Error al eliminar usuario');
    }
  };

  const getRoleLabel = (role) => {
    const roles = {
      admin: { label: 'Administrador', color: 'bg-purple-100 text-purple-700' },
      teacher: { label: 'Docente', color: 'bg-blue-100 text-blue-700' },
      student: { label: 'Estudiante', color: 'bg-green-100 text-green-700' },
    };
    return roles[role] || roles.student;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
            <p className="text-gray-600 text-sm mt-1">
              Administra estudiantes, docentes y administradores
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={loadUsers}
              className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleCreateUser}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-shadow flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Crear Usuario</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="teacher">Docente</option>
            <option value="student">Estudiante</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-8 h-8 text-blue-600" />
            </motion.div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user, index) => {
                  const roleInfo = getRoleLabel(user.role);
                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isActive ? (
                          <span className="flex items-center text-green-700 text-sm">
                            <UserCheck className="w-4 h-4 mr-1" />
                            Activo
                          </span>
                        ) : (
                          <span className="flex items-center text-red-700 text-sm">
                            <UserX className="w-4 h-4 mr-1" />
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        user={selectedUser}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que deseas eliminar a ${userToDelete?.firstName} ${userToDelete?.lastName}? Esta acción desactivará el usuario.`}
      />
    </div>
  );
};

export default Users;
