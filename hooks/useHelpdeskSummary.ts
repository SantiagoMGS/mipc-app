'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { helpdeskService, portalTicketsService } from '@/lib/api';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from './use-toast';

export const summaryKeys = {
  all: ['helpdesk-summary'] as const,
  contract: (contractId: string, month: string) =>
    ['helpdesk-summary', contractId, month] as const,
  portal: (month: string) => ['portal-hours', month] as const,
};

export function useContractMonth(contractId: string, month: string) {
  return useQuery({
    queryKey: summaryKeys.contract(contractId, month),
    queryFn: () => helpdeskService.getMonthSummary(contractId, month),
    enabled: !!contractId,
    // Un mes o contrato inválido (4xx) no mejora reintentando
    retry: (failureCount, error: any) => {
      const status = error?.response?.status ?? 0;
      return (status < 400 || status >= 500) && failureCount < 3;
    },
  });
}

export function useCloseMonth(contractId: string, month: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => helpdeskService.closeMonth(contractId, month),
    onSuccess: (summary) => {
      queryClient.setQueryData(
        summaryKeys.contract(contractId, month),
        summary
      );
      toast({
        title: 'Mes cerrado',
        description: 'Sus cuentas ya no cambian.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'No se pudo cerrar el mes',
        description: apiErrorMessage(error, 'Intenta de nuevo.'),
        variant: 'destructive',
      });
    },
  });
}

export function usePortalHours(month: string, enabled = true) {
  return useQuery({
    queryKey: summaryKeys.portal(month),
    queryFn: () => portalTicketsService.getHours(month),
    enabled,
    // Un 404 (sin contrato) no mejora reintentando; lo demás sí
    retry: (failureCount, error: any) =>
      error?.response?.status !== 404 && failureCount < 3,
  });
}
