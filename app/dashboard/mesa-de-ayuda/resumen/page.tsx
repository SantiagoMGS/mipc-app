'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ConfirmDialog from '@/components/ConfirmDialog';
import MonthPicker from '@/components/helpdesk/MonthPicker';
import MonthSummaryCards from '@/components/helpdesk/MonthSummaryCards';
import { SELECT_CLASS } from '@/components/helpdesk/field-styles';
import { useAllContracts } from '@/hooks/useHelpdeskTickets';
import { useCloseMonth, useContractMonth } from '@/hooks/useHelpdeskSummary';
import { apiErrorMessage } from '@/lib/api-error';
import { getCurrentUserRole } from '@/lib/auth-utils';
import {
  currentBogotaMonth,
  customerName,
  formatBogotaDateTime,
  formatMinutes,
  formatMonth,
} from '@/lib/format';
import { MonthSummary } from '@/types/helpdesk';

function StatusLine({
  summary,
  isCurrent,
}: {
  summary: MonthSummary;
  isCurrent: boolean;
}) {
  if (summary.closed) {
    return (
      <p className="flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-white dark:text-gray-900">
          <Lock className="h-3 w-3" aria-hidden />
          Cerrado
        </span>
        {summary.closedAt && (
          <span>
            el {formatBogotaDateTime(summary.closedAt)}
            {summary.closedBy && ` por ${summary.closedBy.name}`}. Sus cuentas
            ya no cambian.
          </span>
        )}
      </p>
    );
  }
  return (
    <p className="text-sm text-gray-600 dark:text-gray-400">
      {isCurrent
        ? 'Mes en curso: las cifras cambian a medida que se resuelven tickets.'
        : 'Abierto: los tiempos de sus tickets todavía se pueden corregir.'}
    </p>
  );
}

function SummaryPage() {
  const searchParams = useSearchParams();
  const isAdmin = getCurrentUserRole() === 'ADMIN';
  const thisMonth = currentBogotaMonth();
  const { data: contracts = [], isLoading: loadingContracts } =
    useAllContracts();

  const [chosenContract, setChosenContract] = useState(
    searchParams.get('contrato') ?? ''
  );
  const [month, setMonth] = useState(searchParams.get('mes') ?? thisMonth);
  const [confirming, setConfirming] = useState(false);
  // Sin escoger, el primer contrato activo
  const contractId =
    chosenContract ||
    contracts.find((c) => c.isActive)?.id ||
    contracts[0]?.id ||
    '';

  const {
    data: summary,
    isLoading,
    error,
    refetch,
  } = useContractMonth(contractId, month);
  const closeMonth = useCloseMonth(contractId, month);
  const isCurrent = month === thisMonth;
  const canClose = isAdmin && summary && !summary.closed && month < thisMonth;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/mesa-de-ayuda"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        Mesa de ayuda
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Resumen del mes
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Horas de la bolsa, usadas y extra por contrato. Cuenta lo resuelto y
          facturable en cada mes.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-md dark:bg-gray-800 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1 sm:w-80">
          <Label htmlFor="summary-contract">Contrato</Label>
          <select
            id="summary-contract"
            value={contractId}
            onChange={(e) => setChosenContract(e.target.value)}
            className={SELECT_CLASS}
          >
            {loadingContracts && <option value="">Cargando…</option>}
            {!loadingContracts && contracts.length === 0 && (
              <option value="">Aún no hay contratos</option>
            )}
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {customerName(c.customer)}
                {c.isActive ? '' : ' (inactivo)'}
              </option>
            ))}
          </select>
        </div>
        <MonthPicker value={month} onChange={setMonth} max={thisMonth} />
      </div>

      {error ? (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-300">
            No se pudo cargar el resumen:{' '}
            {apiErrorMessage(error, 'revisa la conexión e intenta de nuevo.')}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : isLoading || !summary ? (
        contractId && (
          <div className="flex justify-center p-10">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500" />
          </div>
        )
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <StatusLine summary={summary} isCurrent={isCurrent} />
            {canClose && (
              <Button onClick={() => setConfirming(true)}>
                <Lock />
                Cerrar mes
              </Button>
            )}
          </div>

          <MonthSummaryCards summary={summary} />

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700 dark:text-gray-300">
            <p>
              Respuesta a tiempo:{' '}
              <strong>
                {summary.response.onTime} de {summary.response.total}
              </strong>
              {summary.response.late > 0 && ` (${summary.response.late} tarde)`}
            </p>
            {isCurrent && summary.inProgressCount > 0 && (
              <p>
                {summary.inProgressCount}{' '}
                {summary.inProgressCount === 1
                  ? 'ticket en curso aún no descuenta'
                  : 'tickets en curso aún no descuentan'}
              </p>
            )}
          </div>

          <section
            aria-labelledby="summary-tickets"
            className="rounded-lg bg-white shadow-md dark:bg-gray-800"
          >
            <h2
              id="summary-tickets"
              className="border-b border-gray-200 p-4 font-semibold text-gray-900 dark:border-gray-700 dark:text-white"
            >
              Tickets resueltos en {formatMonth(month).toLowerCase()}
            </h2>
            {summary.tickets.length === 0 ? (
              <p className="p-4 text-sm text-gray-600 dark:text-gray-400">
                Ningún ticket resuelto en este mes.
              </p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {summary.tickets.map((ticket) => (
                  <li
                    key={ticket.id}
                    className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/mesa-de-ayuda/${ticket.id}`}
                        className="font-mono text-xs text-gray-500 hover:underline dark:text-gray-400"
                      >
                        {ticket.number}
                      </Link>
                      <p className="truncate font-medium text-gray-900 dark:text-white">
                        {ticket.subject}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {ticket.requester.name}
                        {ticket.resolvedAt &&
                          ` · ${formatBogotaDateTime(ticket.resolvedAt)}`}
                      </p>
                    </div>
                    <p className="text-sm font-medium tabular-nums text-gray-900 dark:text-white sm:text-right">
                      {ticket.billableMinutes
                        ? formatMinutes(ticket.billableMinutes)
                        : '—'}
                      {!ticket.isBillable && (
                        <span className="block text-xs font-normal text-gray-500">
                          No facturable
                        </span>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <ConfirmDialog
        isOpen={confirming}
        title="Cerrar mes"
        message={`Se guardan las cuentas de ${formatMonth(month).toLowerCase()} y ya no se podrán cambiar el tiempo, el facturable ni las horas de sus tickets.`}
        confirmText="Cerrar mes"
        type="warning"
        isConfirmDisabled={closeMonth.isPending}
        onConfirm={() =>
          closeMonth.mutate(undefined, {
            onSuccess: () => setConfirming(false),
          })
        }
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}

export default function MonthSummaryPage() {
  // useSearchParams necesita un límite de Suspense
  return (
    <Suspense fallback={null}>
      <SummaryPage />
    </Suspense>
  );
}
