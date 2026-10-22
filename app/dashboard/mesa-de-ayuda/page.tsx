'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CalendarOff, LifeBuoy, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/Pagination';
import PriorityBadge from '@/components/helpdesk/PriorityBadge';
import TicketStatusBadge from '@/components/helpdesk/TicketStatusBadge';
import ResponseIndicator from '@/components/helpdesk/ResponseIndicator';
import { SELECT_CLASS } from '@/components/helpdesk/field-styles';
import {
  useActiveContracts,
  useStaffTickets,
} from '@/hooks/useHelpdeskTickets';
import { useTechnicians } from '@/hooks/useAuxiliary';
import { getCurrentUserRole } from '@/lib/auth-utils';
import {
  customerName,
  formatBogotaDateTime,
  formatMinutes,
} from '@/lib/format';
import {
  PRIORITY_LABELS,
  PriorityLevel,
  RESPONSE_STATUS_LABELS,
  ResponseStatus,
  TICKET_STATUS_LABELS,
  TicketStatus,
} from '@/types/helpdesk';

interface Filters {
  status: TicketStatus | '';
  priority: PriorityLevel | '';
  customerId: string;
  assignedTo: string;
  responseStatus: ResponseStatus | '';
}

function TicketList() {
  const searchParams = useSearchParams();
  const role = getCurrentUserRole();
  const canCreate = role === 'ADMIN' || role === 'TECNICO';

  const [filters, setFilters] = useState<Filters>({
    status: '',
    priority: '',
    // Se puede llegar filtrado por cliente desde otra pantalla
    customerId: searchParams.get('cliente') ?? '',
    assignedTo: '',
    responseStatus: '',
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading, error } = useStaffTickets({
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    customerId: filters.customerId || undefined,
    assignedTo: filters.assignedTo || undefined,
    responseStatus: filters.responseStatus || undefined,
    page,
    limit,
  });
  const { data: contracts = [] } = useActiveContracts();
  const { data: technicians = [] } = useTechnicians();

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const hasFilters = Object.values(filters).some(Boolean);
  const tickets = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <LifeBuoy className="w-7 h-7 text-primary-500" aria-hidden />
            Mesa de ayuda
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Solicitudes de las empresas con contrato.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/mesa-de-ayuda/festivos">
              <CalendarOff />
              Festivos
            </Link>
          </Button>
          {canCreate && (
            <Button asChild>
              <Link href="/dashboard/mesa-de-ayuda/nuevo">
                <Plus />
                Nuevo ticket
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
        <select
          aria-label="Estado"
          value={filters.status}
          onChange={(e) =>
            setFilter('status', e.target.value as Filters['status'])
          }
          className={SELECT_CLASS}
        >
          <option value="">Estado</option>
          {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Prioridad"
          value={filters.priority}
          onChange={(e) =>
            setFilter('priority', e.target.value as Filters['priority'])
          }
          className={SELECT_CLASS}
        >
          <option value="">Prioridad</option>
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Cliente"
          value={filters.customerId}
          onChange={(e) => setFilter('customerId', e.target.value)}
          className={`${SELECT_CLASS} col-span-2 lg:col-span-1`}
        >
          <option value="">Cliente</option>
          {contracts.map((contract) => (
            <option key={contract.id} value={contract.customerId}>
              {customerName(contract.customer)}
            </option>
          ))}
        </select>
        <select
          aria-label="Técnico"
          value={filters.assignedTo}
          onChange={(e) => setFilter('assignedTo', e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">Técnico</option>
          {technicians.map((tech: { id: string; name: string }) => (
            <option key={tech.id} value={tech.id}>
              {tech.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Respuesta"
          value={filters.responseStatus}
          onChange={(e) =>
            setFilter(
              'responseStatus',
              e.target.value as Filters['responseStatus']
            )
          }
          className={SELECT_CLASS}
        >
          <option value="">Respuesta</option>
          {Object.entries(RESPONSE_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">
            No se pudieron cargar los tickets.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando tickets…
          </p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <LifeBuoy className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {hasFilters
              ? 'Ningún ticket con estos filtros'
              : 'Aún no hay tickets'}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {hasFilters
              ? 'Cambia o quita los filtros para ver más.'
              : 'Los tickets llegan desde el portal o los registras aquí a nombre del cliente.'}
          </p>
        </div>
      ) : (
        <>
          <ul className="bg-white dark:bg-gray-800 rounded-lg shadow-md divide-y divide-gray-200 dark:divide-gray-700">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  href={`/dashboard/mesa-de-ayuda/${ticket.id}`}
                  className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
                >
                  <div className="flex flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_10rem_9rem] lg:items-center lg:gap-6">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-mono">{ticket.number}</span>
                        <span aria-hidden>·</span>
                        <span>{formatBogotaDateTime(ticket.receivedAt)}</span>
                      </div>
                      <p className="mt-0.5 font-medium text-gray-900 dark:text-white truncate">
                        {ticket.subject}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {customerName(ticket.customer)} ·{' '}
                        {ticket.requester.name}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <PriorityBadge priority={ticket.priority} />
                      <TicketStatusBadge status={ticket.status} />
                    </div>
                    <ResponseIndicator ticket={ticket} />
                    <div className="text-sm text-gray-600 dark:text-gray-400 lg:text-right">
                      {ticket.status === 'RESUELTO' &&
                      ticket.billableMinutes ? (
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatMinutes(ticket.billableMinutes)}
                        </span>
                      ) : (
                        <span>
                          {ticket.assignedTechnician?.name ?? 'Sin asignar'}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {data && data.total > limit && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(data.total / limit)}
              totalItems={data.total}
              itemsPerPage={limit}
              onPageChange={setPage}
              onItemsPerPageChange={(value) => {
                setLimit(value);
                setPage(1);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function MesaDeAyudaPage() {
  // useSearchParams necesita un límite de Suspense
  return (
    <Suspense fallback={null}>
      <TicketList />
    </Suspense>
  );
}
