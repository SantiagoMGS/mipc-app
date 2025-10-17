'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { itemsService } from '@/lib/api';
import { Item, CreateItemDto } from '@/types/item';
import { useToast } from './use-toast';

// Keys para las queries
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (filters: { page?: number; limit?: number; withDeleted?: boolean }) =>
    [...itemKeys.lists(), filters] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
};

// Hook para obtener todos los items (con paginación)
export function useItems(params?: {
  limit?: number;
  page?: number;
  withDeleted?: boolean;
}) {
  return useQuery({
    queryKey: itemKeys.list(params || {}),
    queryFn: () => itemsService.getAll(params),
    select: (data) => ({
      items: Array.isArray(data?.data)
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

// Hook para obtener un item específico
export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => itemsService.getById(id),
    enabled: !!id,
  });
}

// Hook para crear un item
export function useCreateItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateItemDto) => itemsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      toast({
        title: 'Éxito',
        description: '¡Item creado exitosamente!',
      });
    },
    onError: (error: any) => {
      console.error('Error al crear item:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Error al crear el item',
        variant: 'destructive',
      });
    },
  });
}

// Hook para actualizar un item
export function useUpdateItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateItemDto> }) =>
      itemsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: itemKeys.detail(variables.id),
      });
      toast({
        title: 'Éxito',
        description: '¡Item actualizado exitosamente!',
      });
    },
    onError: (error: any) => {
      console.error('Error al actualizar item:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Error al actualizar el item',
        variant: 'destructive',
      });
    },
  });
}

// Hook para eliminar un item
export function useDeleteItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => itemsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      toast({
        title: 'Éxito',
        description: '¡Item eliminado exitosamente!',
      });
    },
    onError: (error: any) => {
      console.error('Error al eliminar item:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Error al eliminar el item',
        variant: 'destructive',
      });
    },
  });
}

// Hook para reactivar un item
export function useReactivateItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => itemsService.reactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      toast({
        title: 'Éxito',
        description: '¡Item reactivado exitosamente!',
      });
    },
    onError: (error: any) => {
      console.error('Error al reactivar item:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Error al reactivar el item',
        variant: 'destructive',
      });
    },
  });
}
