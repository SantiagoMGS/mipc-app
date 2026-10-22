'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Headset, Plus } from 'lucide-react';
import PortalShell, { PortalLoading } from '@/components/portal/PortalShell';
import InstallAppBanner from '@/components/InstallAppBanner';
import PriorityBadge from '@/components/helpdesk/PriorityBadge';
import TicketStatusBadge from '@/components/helpdesk/TicketStatusBadge';
import { Button } from '@/components/ui/button';
import { usePortalSession } from '@/hooks/usePortalSession';
import {
  usePortalHelpdeskContext,
  usePortalTickets,
} from '@/hooks/usePortalTickets';
import { formatBogotaDateTime, formatBogotaLongDate } from '@/lib/format';
import { PortalTicketListItem } from '@/types/helpdesk';

/** ¿Ya le respondieron? Es lo que más le importa a quien espera */
function attentionText(ticket: PortalTicketListItem): string | null {
  if (ticket.status === 'RESUELTO' || ticket.status === 'CANCELADO') {
    return null;
  }
  return ticket.firstResponseAt ? 'Atendido' : 'Esperando respuesta';
}

export default function PortalHelpdeskPage() {
  const { session } = usePortalSession();
  const [page, setPage] = useState(1);
  const { data: context } = usePortalHelpdeskContext(!!session);
  const { data, isLoading } = usePortalTickets(page, !!session);

  if (!session) return <PortalLoading />;
  const isAdmin = session.role === 'CLIENT_ADMIN';
  const tickets = data?.data ?? [];
  const pages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <PortalShell session={session}>
      <div className="space-y-5">
        <InstallAppBanner />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mesa de ayuda
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {isAdmin ? 'Los tickets de tu empresa.' : 'Tus tickets de soporte.'}
          </p>
        </div>

        {context?.hasActiveContract && (
          <Button asChild className="h-12 w-full text-base sm:w-auto">
            <Link href="/portal/mesa-de-ayuda/nuevo">
              <Plus />
              Nuevo ticket
            </Link>
          </Button>
        )}
        {context && !context.hasActiveContract && (
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <AlertCircle
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600"
              aria-hidden
            />
            <p className="text-sm text-amber-900 dark:text-amber-200">
              {context.startsOn
                ? `El contrato de mesa de ayuda de tu empresa empieza el ${formatBogotaLongDate(context.startsOn)}. Desde ese día podrás abrir tickets aquí.`
                : 'Tu empresa no tiene un contrato de mesa de ayuda activo. Puedes consultar tus tickets anteriores; para algo nuevo, escríbenos por WhatsApp.'}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center p-10">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-sm dark:bg-gray-800">
            <Headset className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="font-medium text-gray-900 dark:text-white">
              Aún no hay tickets
            </p>
            {context?.hasActiveContract && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Cuando algo falle, abre uno y te respondemos por WhatsApp.
              </p>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {tickets.map((ticket) => {
              const attention = attentionText(ticket);
              return (
                <li key={ticket.id}>
                  <Link
                    href={`/portal/mesa-de-ayuda/${ticket.id}`}
                    className="block rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:bg-gray-800"
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-mono">{ticket.number}</span> ·{' '}
                      {formatBogotaDateTime(ticket.receivedAt)}
                    </p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white break-words">
                      {ticket.subject}
                    </p>
                    {isAdmin && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {ticket.requester.name}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <TicketStatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                      {attention && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {attention}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Anteriores
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Página {page} de {pages}
            </span>
            <Button
              variant="outline"
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
            >
              Siguientes
            </Button>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
