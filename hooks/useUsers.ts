import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/lib/api';
import { User, CreateUserDto, UpdateUserDto, UserFilters } from '@/types/user';
import { useToast } from './use-toast';

// ==================== QUERY KEYS ====================
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// ==================== QUERIES ====================

/**
 * Hook para obtener lista de usuarios con filtros
 */
export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => usersService.getAll(filters),
  });
}

/**
 * Hook para obtener un usuario por ID
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersService.getById(id),
    enabled: !!id,
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para crear un nuevo usuario
 */
export function useCreateUser() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserDto) => usersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast({
        title: 'Usuario creado',
        description: 'El usuario se ha creado exitosamente',
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al crear el usuario';

      let friendlyMessage = errorMessage;
      if (errorMessage.includes('already exists')) {
        friendlyMessage = 'El email ya está registrado';
      } else if (errorMessage.includes('al menos 8 caracteres')) {
        friendlyMessage =
          'La contraseña debe tener al menos 8 caracteres con mayúscula, minúscula, número y carácter especial';
      } else if (errorMessage.includes('email')) {
        friendlyMessage = 'Formato de email inválido';
      }

      toast({
        title: 'Error',
        description: friendlyMessage,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para actualizar un usuario
 */
export function useUpdateUser() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.id),
      });
      toast({
        title: 'Usuario actualizado',
        description: 'Los cambios se han guardado exitosamente',
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al actualizar el usuario';

      let friendlyMessage = errorMessage;
      if (errorMessage.includes('already exists')) {
        friendlyMessage = 'El email ya está registrado';
      } else if (errorMessage.includes('not found')) {
        friendlyMessage = 'Usuario no encontrado';
      }

      toast({
        title: 'Error',
        description: friendlyMessage,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para eliminar un usuario
 */
export function useDeleteUser() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast({
        title: 'Usuario eliminado',
        description: 'El usuario ha sido desactivado',
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al eliminar el usuario';

      let friendlyMessage = errorMessage;
      if (errorMessage.includes('last active admin')) {
        friendlyMessage = 'No puedes eliminar el último administrador activo';
      } else if (errorMessage.includes('not found')) {
        friendlyMessage = 'Usuario no encontrado';
      }

      toast({
        title: 'Error',
        description: friendlyMessage,
        variant: 'destructive',
      });
    },
  });
}
