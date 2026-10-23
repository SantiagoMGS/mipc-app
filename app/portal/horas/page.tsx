'use client';

import { useState } from 'react';
import Link from 'next/link';
import PortalShell, { PortalLoading } from '@/components/portal/PortalShell';
import MonthPicker from '@/components/helpdesk/MonthPicker';
import MonthSummaryCards from '@/components/helpdesk/MonthSummaryCards';
import { Button } from '@/components/ui/button';
import { usePortalSession } from '@/hooks/usePortalSession';
import { usePortalHours } from '@/hooks/useHelpdeskSummary';
import {
  currentBogotaMonth,
  formatBogotaDateTime,
  formatMinutes,
  formatMonth,
} from '@/lib/format';

/** Horas del mes de la empresa: solo para su administrador */
export default function PortalHoursPage() {
  const { session } = usePortalSession({ adminOnly: true });
  const thisMonth = currentBogotaMonth();
  const [month, setMonth] = useState(thisMonth);
  const {
    data: summary,
    isLoading,
    error,
    refetch,
  } = usePortalHours(month, !!session);
  const noContract = (error as any)?.response?.status === 404;

  if (!session) return <PortalLoading />;

  return (
    <PortalShell session={session}>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Horas del mes
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Cuenta el tiempo de los tickets resueltos en el mes. Las horas que
            no se usan no pasan al siguiente.
          </p>
        </div>

        <div className="flex justify-center rounded-lg bg-white p-2 shadow-sm dark:bg-gray-800">
          <MonthPicker value={month} onChange={setMonth} max={thisMonth} />
        </div>

        {isLoading ? (
          <div className="flex justify-center p-10">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500" />
          </div>
        ) : noContract ? (
          <p className="rounded-lg bg-white p-4 text-sm text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-300">
            Tu empresa no tiene un contrato de mesa de ayuda.
          </p>
        ) : error || !summary ? (
          <div className="space-y-3 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              No se pudieron cargar las horas. Revisa tu conexión e intenta de
              nuevo.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (
          <>
            <MonthSummaryCards summary={summary} />
            {summary.closed && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mes cerrado: estas cifras ya no cambian.
              </p>
            )}
            {month === thisMonth && summary.inProgressCount > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {summary.inProgressCount}{' '}
                {summary.inProgressCount === 1
                  ? 'ticket en curso se descontará cuando se resuelva.'
                  : 'tickets en curso se descontarán cuando se resuelvan.'}
              </p>
            )}

            <section
              aria-labelledby="hours-tickets"
              className="rounded-lg bg-white shadow-sm dark:bg-gray-800"
            >
              <h2
                id="hours-tickets"
                className="border-b border-gray-200 p-4 font-semibold text-gray-900 dark:border-gray-700 dark:text-white"
              >
                Tickets de {formatMonth(month).toLowerCase()}
              </h2>
              {summary.tickets.length === 0 ? (
                <p className="p-4 text-sm text-gray-600 dark:text-gray-400">
                  Ningún ticket resuelto en este mes.
                </p>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {summary.tickets.map((ticket) => (
                    <li key={ticket.id}>
                      <Link
                        href={`/portal/mesa-de-ayuda/${ticket.id}`}
                        className="flex items-start justify-between gap-3 p-4 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 dark:hover:bg-gray-700/50"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
                            {ticket.number}
                          </p>
                          <p className="break-words font-medium text-gray-900 dark:text-white">
                            {ticket.subject}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {ticket.requester.name}
                            {ticket.resolvedAt &&
                              ` · ${formatBogotaDateTime(ticket.resolvedAt)}`}
                          </p>
                        </div>
                        <p className="flex-shrink-0 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white">
                          {ticket.isBillable && ticket.billableMinutes
                            ? formatMinutes(ticket.billableMinutes)
                            : 'No descuenta'}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </PortalShell>
  );
}
