'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { portalUsersService } from '@/lib/api';
import { CreatePortalUserDto, UpdatePortalUserDto } from '@/types/helpdesk';
import { useToast } from './use-toast';

const KEY = ['portal-self-users'] as const;

function errorMessage(error: any, fallback: string): string {
  const message = error?.response?.data?.message;
  return Array.isArray(message) ? message.join(', ') : message || fallback;
}

/** Usuarios de su empresa, para el administrador del cliente en el portal */
export function usePortalSelfUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onError = (fallback: string) => (error: any) =>
    toast({
      title: fallback,
      description: errorMessage(error, 'Intenta de nuevo.'),
      variant: 'destructive',
    });
  const refresh = () => queryClient.invalidateQueries({ queryKey: KEY });

  return {
    users: useQuery({ queryKey: KEY, queryFn: portalUsersService.getAll }),
    create: useMutation({
      mutationFn: (data: CreatePortalUserDto) =>
        portalUsersService.create(data),
      onSuccess: refresh,
      onError: onError('No se pudo crear el usuario'),
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdatePortalUserDto }) =>
        portalUsersService.update(id, data),
      onSuccess: refresh,
      onError: onError('No se pudo actualizar el usuario'),
    }),
    reset: useMutation({
      mutationFn: (id: string) => portalUsersService.resetPassword(id),
      onSuccess: refresh,
      onError: onError('No se pudo reasignar la contraseña'),
    }),
  };
}
