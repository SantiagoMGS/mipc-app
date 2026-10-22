'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { helpdeskService } from '@/lib/api';
import {
  CreateHelpdeskContractDto,
  UpdateHelpdeskContractDto,
} from '@/types/helpdesk';
import { useToast } from './use-toast';
import { apiErrorMessage as errorMessage } from '@/lib/api-error';

export const contractKeys = {
  byCustomer: (customerId: string) =>
    ['helpdesk-contracts', customerId] as const,
};

/** Contrato vigente del cliente: el activo, o el más reciente si no hay activo */
export function useCustomerContract(customerId: string) {
  return useQuery({
    queryKey: contractKeys.byCustomer(customerId),
    queryFn: () => helpdeskService.getContracts(customerId),
    select: (contracts) =>
      contracts.find((c) => c.isActive) ?? contracts[0] ?? null,
    enabled: !!customerId,
  });
}

export function useCreateContract(customerId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: CreateHelpdeskContractDto) =>
      helpdeskService.createContract(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contractKeys.byCustomer(customerId),
      });
      toast({
        title: 'Contrato creado',
        description: 'La empresa ya puede usar la mesa de ayuda.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'No se pudo crear el contrato',
        description: errorMessage(error, 'Intenta de nuevo.'),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateContract(customerId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateHelpdeskContractDto;
    }) => helpdeskService.updateContract(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contractKeys.byCustomer(customerId),
      });
      toast({ title: 'Contrato actualizado' });
    },
    onError: (error: any) => {
      toast({
        title: 'No se pudo guardar el contrato',
        description: errorMessage(error, 'Intenta de nuevo.'),
        variant: 'destructive',
      });
    },
  });
}
