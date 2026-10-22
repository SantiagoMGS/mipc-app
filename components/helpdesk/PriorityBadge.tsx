import { PRIORITY_LABELS, PriorityLevel } from '@/types/helpdesk';

const COLORS: Record<PriorityLevel, string> = {
  CRITICA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  ALTA: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  NORMAL: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  SOLICITUD: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export default function PriorityBadge({
  priority,
}: {
  priority: PriorityLevel;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${COLORS[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
