'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { devicesService } from '@/lib/api';
import { Device, CreateDeviceForCustomerDto } from '@/types/device';
import { useToast } from './use-toast';

// Keys para las queries
export const deviceKeys = {
  all: ['devices'] as const,
  lists: () => [...deviceKeys.all, 'list'] as const,
  list: (filters: { page?: number; limit?: number }) =>
    [...deviceKeys.lists(), filters] as const,
  byCustomer: (customerId: string) =>
    [...deviceKeys.all, 'customer', customerId] as const,
  details: () => [...deviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...deviceKeys.details(), id] as const,
};

// Hook para obtener todos los dispositivos (con paginación)
export function useDevices(params?: { limit?: number; page?: number }) {
  return useQuery({
    queryKey: deviceKeys.list(params || {}),
    queryFn: () => devicesService.getAll(params),
    select: (data) => ({
      devices: Array.isArray(data?.data)
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

// Hook para obtener dispositivos de un cliente
export function useCustomerDevices(customerId: string) {
  return useQuery({
    queryKey: deviceKeys.byCustomer(customerId),
    queryFn: () => devicesService.getByCustomerId(customerId),
    enabled: !!customerId,
    select: (data) => (Array.isArray(data) ? data : []),
  });
}

// Hook para obtener un dispositivo específico
export function useDevice(id: string) {
  return useQuery({
    queryKey: deviceKeys.detail(id),
    queryFn: () => devicesService.getById(id),
    enabled: !!id,
  });
}

// Hook para crear un dispositivo para un cliente
export function useCreateDeviceForCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateDeviceForCustomerDto) =>
      devicesService.createForCustomer(data),
    onSuccess: (_, variables) => {
      // Invalidar dispositivos del cliente
      queryClient.invalidateQueries({
        queryKey: deviceKeys.byCustomer(variables.customerId),
      });
      toast({
        title: 'Éxito',
        description: '¡Dispositivo agregado exitosamente!',
      });
    },
    onError: (error: any) => {
      console.error('Error al crear dispositivo:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Error al crear el dispositivo',
        variant: 'destructive',
      });
    },
  });
}

// Hook para actualizar un dispositivo
export function useUpdateDevice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      devicesService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: deviceKeys.detail(variables.id),
      });
      toast({
        title: 'Éxito',
        description: '¡Dispositivo actualizado exitosamente!',
      });
    },
    onError: (error: any) => {
      console.error('Error al actualizar dispositivo:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Error al actualizar el dispositivo',
        variant: 'destructive',
      });
    },
  });
}

// Hook para eliminar/inactivar un dispositivo
export function useDeleteDevice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => devicesService.delete(id),
    onSuccess: () => {
      // Invalidar todas las queries de dispositivos
      queryClient.invalidateQueries({ queryKey: deviceKeys.all });
      toast({
        title: 'Éxito',
        description: '¡Dispositivo inactivado exitosamente!',
      });
    },
    onError: (error: any) => {
      console.error('Error al inactivar dispositivo:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Error al inactivar el dispositivo',
        variant: 'destructive',
      });
    },
  });
}

// Hook para activar un dispositivo
export function useActivateDevice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => devicesService.activate(id),
    onSuccess: () => {
      // Invalidar todas las queries de dispositivos
      queryClient.invalidateQueries({ queryKey: deviceKeys.all });
      toast({
        title: 'Éxito',
        description: '¡Dispositivo activado exitosamente!',
      });
    },
    onError: (error: any) => {
      console.error('Error al activar dispositivo:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Error al activar el dispositivo',
        variant: 'destructive',
      });
    },
  });
}
