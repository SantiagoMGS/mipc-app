'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customersService } from '@/lib/api';
import { Customer, CreateCustomerDto } from '@/types/customer';
import { useToast } from './use-toast';

// Keys para las queries
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters: { page?: number; limit?: number }) =>
    [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

// Hook para obtener todos los clientes (con paginación)
export function useCustomers(params?: { limit?: number; page?: number }) {
  return useQuery({
    queryKey: customerKeys.list(params || {}),
    queryFn: () => customersService.getAll(params),
    select: (data) => ({
      customers: Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [],
      total: data?.total || 0,
      page: data?.page || 1,
      limit: data?.limit || 10,
    }),
  });
}

// Hook para obtener un cliente específico
export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersService.getById(id),
    enabled: !!id, // Solo ejecutar si hay ID
  });
}

// Hook para crear un cliente
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCustomerDto) => customersService.create(data),
    onSuccess: () => {
      // Invalidar queries para refetch automático
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      toast({
        title: 'Éxito',
        description: '¡Cliente creado exitosamente!',
      });
    },
    onError: (error: any) => {
      console.error('Error al crear cliente:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Error al crear el cliente',
        variant: 'destructive',
      });
    },
  });
}

// Hook para actualizar un cliente
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateCustomerDto>;
    }) => customersService.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(variables.id),
      });
      toast({
        title: 'Éxito',
        description: '¡Cliente actualizado exitosamente!',
      });
    },
    onError: (error: any) => {
      console.error('Error al actualizar cliente:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Error al actualizar el cliente',
        variant: 'destructive',
      });
    },
  });
}

// Hook para eliminar un cliente
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => customersService.delete(id),
    onSuccess: () => {
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      toast({
        title: 'Éxito',
        description: '¡Cliente eliminado exitosamente!',
      });
    },
    onError: (error: any) => {
      console.error('Error al eliminar cliente:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Error al eliminar el cliente',
        variant: 'destructive',
      });
    },
  });
}
