'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { helpdeskService } from '@/lib/api';
import { CreatePortalUserDto, UpdatePortalUserDto } from '@/types/helpdesk';
import { useToast } from './use-toast';

export const portalUserKeys = {
  byCustomer: (customerId: string) => ['portal-users', customerId] as const,
};

function errorMessage(error: any, fallback: string): string {
  const message = error?.response?.data?.message;
  return Array.isArray(message) ? message.join(', ') : message || fallback;
}

export function usePortalUsers(customerId: string) {
  return useQuery({
    queryKey: portalUserKeys.byCustomer(customerId),
    queryFn: () => helpdeskService.getPortalUsers(customerId),
    enabled: !!customerId,
  });
}

export function useCreatePortalUser(customerId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: CreatePortalUserDto) =>
      helpdeskService.createPortalUser(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: portalUserKeys.byCustomer(customerId),
      });
    },
    onError: (error: any) => {
      toast({
        title: 'No se pudo crear el usuario',
        description: errorMessage(error, 'Intenta de nuevo.'),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdatePortalUser(customerId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePortalUserDto }) =>
      helpdeskService.updatePortalUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: portalUserKeys.byCustomer(customerId),
      });
    },
    onError: (error: any) => {
      toast({
        title: 'No se pudo actualizar el usuario',
        description: errorMessage(error, 'Intenta de nuevo.'),
        variant: 'destructive',
      });
    },
  });
}

export function useResetPortalUserPassword(customerId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => helpdeskService.resetPortalUserPassword(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: portalUserKeys.byCustomer(customerId),
      });
    },
    onError: (error: any) => {
      toast({
        title: 'No se pudo reasignar la contraseña',
        description: errorMessage(error, 'Intenta de nuevo.'),
        variant: 'destructive',
      });
    },
  });
}
