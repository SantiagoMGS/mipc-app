'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { helpdeskService } from '@/lib/api';
import { apiErrorMessage } from '@/lib/api-error';
import {
  CreateStaffTicketDto,
  ResolveTicketDto,
  StaffTicketDetail,
  StaffTicketFilters,
  UpdateTicketDto,
} from '@/types/helpdesk';
import { useToast } from './use-toast';
import { summaryKeys } from './useHelpdeskSummary';

export const ticketKeys = {
  all: ['helpdesk-tickets'] as const,
  list: (filters: StaffTicketFilters) =>
    ['helpdesk-tickets', 'list', filters] as const,
  detail: (id: string) => ['helpdesk-tickets', 'detail', id] as const,
};

export function useStaffTickets(filters: StaffTicketFilters) {
  return useQuery({
    queryKey: ticketKeys.list(filters),
    queryFn: () => helpdeskService.getTickets(filters),
    // Los vencimientos cambian con el tiempo: se refresca cada minuto
    refetchInterval: 60_000,
  });
}

export function useStaffTicket(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => helpdeskService.getTicket(id),
    enabled: !!id,
  });
}

/** Todos los contratos, con el nombre de la empresa */
export function useAllContracts() {
  return useQuery({
    queryKey: ['helpdesk-contracts', 'all'],
    queryFn: () => helpdeskService.getAllContracts(),
  });
}

/** Contratos activos, con el nombre de la empresa */
export function useActiveContracts() {
  return useQuery({
    queryKey: ['helpdesk-contracts', 'all'],
    queryFn: () => helpdeskService.getAllContracts(),
    select: (contracts) => contracts.filter((c) => c.isActive),
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: CreateStaffTicketDto) =>
      helpdeskService.createTicket(data),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      queryClient.invalidateQueries({ queryKey: summaryKeys.all });
      toast({ title: `Ticket ${ticket.number} creado` });
    },
    onError: (error: any) => {
      toast({
        title: 'No se pudo crear el ticket',
        description: apiErrorMessage(error, 'Intenta de nuevo.'),
        variant: 'destructive',
      });
    },
  });
}

type TicketAction =
  | { type: 'take'; firstResponseAt?: string }
  | { type: 'update'; data: UpdateTicketDto }
  | { type: 'resolve'; data: ResolveTicketDto }
  | { type: 'reopen' }
  | { type: 'cancel'; reason: string };

const SUCCESS: Record<TicketAction['type'], string> = {
  take: 'Ticket tomado',
  update: 'Cambios guardados',
  resolve: 'Ticket resuelto',
  reopen: 'Ticket reabierto',
  cancel: 'Ticket cancelado',
};

function runAction(id: string, action: TicketAction) {
  switch (action.type) {
    case 'take':
      return helpdeskService.takeTicket(id, action.firstResponseAt);
    case 'update':
      return helpdeskService.updateTicket(id, action.data);
    case 'resolve':
      return helpdeskService.resolveTicket(id, action.data);
    case 'reopen':
      return helpdeskService.reopenTicket(id);
    case 'cancel':
      return helpdeskService.cancelTicket(id, action.reason);
  }
}

/** Tomar, editar, resolver, reabrir o cancelar; el detalle se actualiza con la respuesta */
export function useTicketAction(id: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (action: TicketAction) => runAction(id, action),
    onSuccess: (ticket: StaffTicketDetail, action) => {
      queryClient.setQueryData(ticketKeys.detail(id), ticket);
      queryClient.invalidateQueries({
        queryKey: [...ticketKeys.all, 'list'],
      });
      queryClient.invalidateQueries({ queryKey: summaryKeys.all });
      toast({ title: SUCCESS[action.type] });
    },
    onError: (error: any) => {
      toast({
        title: 'No se pudo guardar',
        description: apiErrorMessage(error, 'Intenta de nuevo.'),
        variant: 'destructive',
      });
    },
  });
}
