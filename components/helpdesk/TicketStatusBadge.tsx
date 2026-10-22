import { TICKET_STATUS_LABELS, TicketStatus } from '@/types/helpdesk';

// Naranja de marca para lo que está en manos de un técnico
const COLORS: Record<TicketStatus, string> = {
  ABIERTO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  EN_ATENCION:
    'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  RESUELTO:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  CANCELADO: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export default function TicketStatusBadge({
  status,
}: {
  status: TicketStatus;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${COLORS[status]}`}
    >
      {TICKET_STATUS_LABELS[status]}
    </span>
  );
}
