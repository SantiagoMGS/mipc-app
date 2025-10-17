'use client';

import { useState } from 'react';
import { User, UserRole, USER_ROLE_LABELS } from '@/types/user';
import { useUsers } from '@/hooks/useUsers';
import { UsersTable } from '@/components/UsersTable';
import { UserFormModal } from '@/components/UserFormModal';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Users as UsersIcon,
  Pencil,
  Trash2,
  Mail,
  Shield,
  Check,
  X,
} from 'lucide-react';
import { useViewMode } from '@/contexts/ViewModeContext';
import { ViewModeToggle } from '@/components/ViewModeToggle';
import { useDeleteUser } from '@/hooks/useUsers';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function UsersPage() {
  const { viewMode } = useViewMode();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const deleteMutation = useDeleteUser();

  const filters = roleFilter === 'ALL' ? undefined : { role: roleFilter };
  const { data: usersData, isLoading } = useUsers(filters);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await deleteMutation.mutateAsync(userToDelete.id);
      setUserToDelete(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case UserRole.TECNICO:
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case UserRole.AUXILIAR:
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const users = usersData?.data || [];
  const activeUsers = users.filter((u) => u.isActive).length;
  const inactiveUsers = users.filter((u) => !u.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Usuarios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona los usuarios del sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewModeToggle />
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Usuarios
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {users.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Usuarios Activos
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {activeUsers}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Usuarios Inactivos
              </p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                {inactiveUsers}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filtrar por rol:
          </span>
          <div className="flex gap-2">
            <Button
              variant={roleFilter === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('ALL')}
            >
              Todos
            </Button>
            <Button
              variant={roleFilter === UserRole.ADMIN ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter(UserRole.ADMIN)}
            >
              Administradores
            </Button>
            <Button
              variant={roleFilter === UserRole.TECNICO ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter(UserRole.TECNICO)}
            >
              Técnicos
            </Button>
            <Button
              variant={roleFilter === UserRole.AUXILIAR ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter(UserRole.AUXILIAR)}
            >
              Auxiliares
            </Button>
          </div>
        </div>
      </div>

      {/* Table or Cards View */}
      {viewMode === 'table' ? (
        <UsersTable users={users} onEdit={handleEdit} isLoading={isLoading} />
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
              <div className="text-center text-gray-500 dark:text-gray-400">
                Cargando usuarios...
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  No hay usuarios registrados
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Crea el primer usuario para comenzar
                </p>
              </div>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header con rol */}
                <div
                  className={`px-4 pt-4 pb-2 bg-gradient-to-r ${
                    user.role === UserRole.ADMIN
                      ? 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20'
                      : user.role === UserRole.TECNICO
                      ? 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20'
                      : 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20'
                  }`}
                >
                  <span
                    className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(
                      user.role
                    )}`}
                  >
                    {USER_ROLE_LABELS[user.role]}
                  </span>
                </div>

                <div className="p-4">
                  {/* Nombre */}
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                    {user.name}
                  </h3>

                  {/* Email */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <Mail className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  {/* Estado */}
                  <div className="flex items-center gap-2 mb-4">
                    {user.isActive ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30">
                        <Check className="w-3.5 h-3.5 text-green-700 dark:text-green-400" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">
                          Activo
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30">
                        <X className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                        <span className="text-xs font-medium text-red-700 dark:text-red-400">
                          Inactivo
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleEdit(user)}
                      className="flex-1 flex items-center justify-center px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user)}
                      className="flex-1 flex items-center justify-center px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      <UserFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        user={selectedUser}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        onCancel={() => setUserToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Usuario"
        message={
          userToDelete
            ? `¿Estás seguro de que deseas eliminar al usuario "${userToDelete.name}"? Esta acción realizará una eliminación suave (soft delete) y puede revertirse activando el usuario nuevamente.`
            : ''
        }
        confirmText="Eliminar"
        isConfirmDisabled={deleteMutation.isPending}
      />
    </div>
  );
}
