'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deviceTypesService } from '@/lib/api';
import { DeviceType, CreateDeviceTypeDto } from '@/types/device-type';
import { useToast } from './use-toast';

// Keys para las queries
export const deviceTypeKeys = {
  all: ['device-types'] as const,
  lists: () => [...deviceTypeKeys.all, 'list'] as const,
  list: (filters: { page?: number; limit?: number; withDeleted?: boolean }) =>
    [...deviceTypeKeys.lists(), filters] as const,
  details: () => [...deviceTypeKeys.all, 'detail'] as const,
  detail: (id: string) => [...deviceTypeKeys.details(), id] as const,
};

// Hook para obtener todos los tipos de dispositivo (con paginación)
export function useDeviceTypes(params?: {
  limit?: number;
  page?: number;
  withDeleted?: boolean;
}) {
  return useQuery({
    queryKey: deviceTypeKeys.list(params || {}),
    queryFn: () => deviceTypesService.getAll(params),
    select: (data) => ({
      deviceTypes: Array.isArray(data?.data)
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

// Hook para obtener un tipo de dispositivo específico
export function useDeviceType(id: string) {
  return useQuery({
    queryKey: deviceTypeKeys.detail(id),
    queryFn: () => deviceTypesService.getById(id),
    enabled: !!id,
  });
}

// Hook para crear un tipo de dispositivo
export function useCreateDeviceType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateDeviceTypeDto) => deviceTypesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceTypeKeys.lists() });
      toast({
        title: 'Éxito',
        description: '¡Tipo de dispositivo creado exitosamente!',
      });
    },
    onError: (error: any) => {
      console.error('Error al crear tipo de dispositivo:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message ||
          'Error al crear el tipo de dispositivo',
        variant: 'destructive',
      });
    },
  });
}

// Hook para actualizar un tipo de dispositivo
export function useUpdateDeviceType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateDeviceTypeDto>;
    }) => deviceTypesService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deviceTypeKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: deviceTypeKeys.detail(variables.id),
      });
      toast({
        title: 'Éxito',
        description: '¡Tipo de dispositivo actualizado exitosamente!',
      });
    },
    onError: (error: any) => {
      console.error('Error al actualizar tipo de dispositivo:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message ||
          'Error al actualizar el tipo de dispositivo',
        variant: 'destructive',
      });
    },
  });
}

// Hook para eliminar un tipo de dispositivo
export function useDeleteDeviceType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deviceTypesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceTypeKeys.lists() });
      toast({
        title: 'Éxito',
        description: '¡Tipo de dispositivo eliminado exitosamente!',
      });
    },
    onError: (error: any) => {
      console.error('Error al eliminar tipo de dispositivo:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message ||
          'Error al eliminar el tipo de dispositivo',
        variant: 'destructive',
      });
    },
  });
}

// Hook para reactivar un tipo de dispositivo
export function useReactivateDeviceType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deviceTypesService.reactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceTypeKeys.lists() });
      toast({
        title: 'Éxito',
        description: '¡Tipo de dispositivo reactivado exitosamente!',
      });
    },
    onError: (error: any) => {
      console.error('Error al reactivar tipo de dispositivo:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message ||
          'Error al reactivar el tipo de dispositivo',
        variant: 'destructive',
      });
    },
  });
}
