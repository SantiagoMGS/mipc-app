import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '@/lib/api';
import {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilters,
} from '@/types/task';
import { useToast } from './use-toast';

// ==================== QUERY KEYS ====================
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

// ==================== QUERIES ====================

/**
 * Hook para obtener lista de tareas con filtros
 */
export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => tasksService.getAll(filters),
  });
}

/**
 * Hook para obtener una tarea por ID
 */
export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksService.getById(id),
    enabled: !!id,
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para crear una nueva tarea
 */
export function useCreateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateTaskDto) => tasksService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast({
        title: 'Éxito',
        description: '¡Tarea creada exitosamente!',
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al crear la tarea';
      toast({
        title: 'Error',
        description: Array.isArray(errorMessage)
          ? errorMessage.join(', ')
          : errorMessage,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para actualizar una tarea
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) =>
      tasksService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: taskKeys.detail(variables.id),
      });
      toast({
        title: 'Éxito',
        description: '¡Tarea actualizada exitosamente!',
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al actualizar la tarea';
      toast({
        title: 'Error',
        description: Array.isArray(errorMessage)
          ? errorMessage.join(', ')
          : errorMessage,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para eliminar una tarea
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => tasksService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast({
        title: 'Éxito',
        description: '¡Tarea eliminada exitosamente!',
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al eliminar la tarea';
      toast({
        title: 'Error',
        description: Array.isArray(errorMessage)
          ? errorMessage.join(', ')
          : errorMessage,
        variant: 'destructive',
      });
    },
  });
}
