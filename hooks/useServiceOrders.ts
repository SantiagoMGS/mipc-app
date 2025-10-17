import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { serviceOrdersService } from '@/lib/api';
import {
  ServiceOrder,
  CreateServiceOrderDto,
  UpdateServiceOrderDto,
  ServiceOrderFilters,
} from '@/types/service-order';
import { useToast } from './use-toast';

// ==================== QUERY KEYS ====================
export const serviceOrderKeys = {
  all: ['serviceOrders'] as const,
  lists: () => [...serviceOrderKeys.all, 'list'] as const,
  list: (filters?: ServiceOrderFilters) =>
    [...serviceOrderKeys.lists(), filters] as const,
  details: () => [...serviceOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceOrderKeys.details(), id] as const,
  byOrderNumber: (orderNumber: string) =>
    [...serviceOrderKeys.all, 'orderNumber', orderNumber] as const,
};

// ==================== QUERIES ====================

/**
 * Hook para obtener lista de órdenes de servicio con filtros
 */
export function useServiceOrders(filters?: ServiceOrderFilters) {
  return useQuery({
    queryKey: serviceOrderKeys.list(filters),
    queryFn: () => serviceOrdersService.getAll(filters),
  });
}

/**
 * Hook para obtener una orden de servicio por ID
 */
export function useServiceOrder(id: string) {
  return useQuery({
    queryKey: serviceOrderKeys.detail(id),
    queryFn: () => serviceOrdersService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook para obtener una orden por número
 */
export function useServiceOrderByNumber(orderNumber: string) {
  return useQuery({
    queryKey: serviceOrderKeys.byOrderNumber(orderNumber),
    queryFn: () => serviceOrdersService.getByOrderNumber(orderNumber),
    enabled: !!orderNumber,
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para crear una nueva orden de servicio
 */
export function useCreateServiceOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateServiceOrderDto) =>
      serviceOrdersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.lists() });
      toast({
        title: 'Éxito',
        description: '¡Orden de servicio creada exitosamente!',
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al crear la orden de servicio';
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
 * Hook para actualizar una orden de servicio
 */
export function useUpdateServiceOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceOrderDto }) =>
      serviceOrdersService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: serviceOrderKeys.detail(variables.id),
      });
      toast({
        title: 'Éxito',
        description: '¡Orden de servicio actualizada exitosamente!',
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al actualizar la orden de servicio';
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
 * Hook para cambiar el estado de una orden de servicio
 */
export function useChangeServiceOrderStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      newStatus,
      notes,
    }: {
      id: string;
      newStatus: string;
      notes?: string;
    }) => serviceOrdersService.changeStatus(id, newStatus, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: serviceOrderKeys.detail(variables.id),
      });
      toast({
        title: 'Éxito',
        description: '¡Estado de la orden actualizado exitosamente!',
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al cambiar el estado de la orden';
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
