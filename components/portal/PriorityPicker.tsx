import { formatTarget } from '@/lib/helpdesk-format';
import {
  PortalHelpdeskContext,
  PRIORITY_LABELS,
  PriorityLevel,
} from '@/types/helpdesk';

// Una franja de color por prioridad, como las etiquetas del panel
const ACCENT: Record<PriorityLevel, string> = {
  CRITICA: 'bg-red-500',
  ALTA: 'bg-orange-500',
  NORMAL: 'bg-sky-500',
  SOLICITUD: 'bg-gray-400',
};

interface PriorityPickerProps {
  priorities: PortalHelpdeskContext['priorities'];
  value: PriorityLevel;
  onChange: (level: PriorityLevel) => void;
}

/** Tarjetas grandes para escoger la prioridad con el criterio del contrato */
export default function PriorityPicker({
  priorities,
  value,
  onChange,
}: PriorityPickerProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-900 dark:text-white">
        Prioridad
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {priorities.map((p) => (
          <label
            key={p.level}
            className={`relative flex cursor-pointer gap-3 overflow-hidden rounded-lg border bg-white p-3 pl-4 transition-colors dark:bg-gray-800 ${
              value === p.level
                ? 'border-primary-500 ring-2 ring-primary-500'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
            }`}
          >
            <span
              className={`absolute inset-y-0 left-0 w-1.5 ${ACCENT[p.level]}`}
              aria-hidden
            />
            <input
              type="radio"
              name="priority"
              value={p.level}
              checked={value === p.level}
              onChange={() => onChange(p.level)}
              className="mt-1 h-4 w-4 accent-primary-500"
            />
            <span className="min-w-0">
              <span className="block font-semibold text-gray-900 dark:text-white">
                {PRIORITY_LABELS[p.level]}
              </span>
              <span className="block text-sm text-gray-600 dark:text-gray-400">
                {p.criterion}
              </span>
              <span className="mt-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Respuesta en{' '}
                {formatTarget(p.targetAmount, p.targetUnit).toLowerCase()}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
