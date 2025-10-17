'use client';

import { useState } from 'react';
import { User, UserRole, USER_ROLE_LABELS } from '@/types/user';
import { useDeleteUser } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Pencil, Trash2, Check, X } from 'lucide-react';

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  isLoading?: boolean;
}

export function UsersTable({ users, onEdit, isLoading }: UsersTableProps) {
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const deleteMutation = useDeleteUser();

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

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Cargando usuarios...
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            No hay usuarios registrados
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Crea el primer usuario para comenzar
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 dark:border-gray-700">
              <TableHead className="text-gray-700 dark:text-gray-300">
                Nombre
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">
                Email
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">
                Rol
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">
                Estado
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="border-gray-200 dark:border-gray-700"
              >
                <TableCell className="font-medium text-gray-900 dark:text-white">
                  {user.name}
                </TableCell>
                <TableCell className="text-gray-600 dark:text-gray-400">
                  {user.email}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(
                      user.role
                    )}`}
                  >
                    {USER_ROLE_LABELS[user.role]}
                  </span>
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(user)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUserToDelete(user)}
                      className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
    </>
  );
}
