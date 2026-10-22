'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { portalTicketsService } from '@/lib/api';
import { apiErrorMessage } from '@/lib/api-error';
import { CreatePortalTicketDto } from '@/types/helpdesk';
import { useToast } from './use-toast';

const portalTicketKeys = {
  all: ['portal-tickets'] as const,
  context: ['portal-tickets', 'context'] as const,
  list: (page: number) => ['portal-tickets', 'list', page] as const,
  detail: (id: string) => ['portal-tickets', 'detail', id] as const,
};

/** ¿Hay contrato activo?, prioridades del contrato y equipos de la empresa */
export function usePortalHelpdeskContext(enabled = true) {
  return useQuery({
    queryKey: portalTicketKeys.context,
    queryFn: () => portalTicketsService.getContext(),
    enabled,
  });
}

export function usePortalTickets(page: number, enabled = true) {
  return useQuery({
    queryKey: portalTicketKeys.list(page),
    queryFn: () => portalTicketsService.getAll({ page, limit: 20 }),
    enabled,
  });
}

export function usePortalTicket(id: string, enabled = true) {
  return useQuery({
    queryKey: portalTicketKeys.detail(id),
    queryFn: () => portalTicketsService.getById(id),
    enabled: enabled && !!id,
    // Un 404 (ticket ajeno) no mejora reintentando
    retry: false,
  });
}

/** Crea el ticket y después sube las capturas */
export function useCreatePortalTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({
      data,
      files,
    }: {
      data: CreatePortalTicketDto;
      files: File[];
    }) => {
      const ticket = await portalTicketsService.create(data);
      if (files.length > 0) {
        try {
          await portalTicketsService.uploadAttachments(ticket.id, files);
        } catch (error) {
          // El ticket ya existe: se avisa y se sigue al detalle
          toast({
            title: 'El ticket se creó, pero las capturas no se subieron',
            description: apiErrorMessage(error, 'Envíalas por WhatsApp.'),
            variant: 'destructive',
          });
        }
      }
      return ticket;
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: portalTicketKeys.all });
      toast({ title: `Ticket ${ticket.number} enviado` });
    },
    onError: (error: any) => {
      toast({
        title: 'No se pudo enviar el ticket',
        description: apiErrorMessage(error, 'Intenta de nuevo.'),
        variant: 'destructive',
      });
    },
  });
}
