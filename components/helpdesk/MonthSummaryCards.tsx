import { formatMinutes } from '@/lib/format';
import { MonthSummary } from '@/types/helpdesk';

function Figure({
  label,
  value,
  hint,
  tone = 'default',
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'accent';
  children?: React.ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`rounded-lg p-4 shadow-sm ${
        tone === 'accent'
          ? 'bg-primary-50 ring-1 ring-primary-200 dark:bg-primary-900/20 dark:ring-primary-800'
          : 'bg-white dark:bg-gray-800'
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums ${
          tone === 'accent'
            ? 'text-primary-700 dark:text-primary-300'
            : 'text-gray-900 dark:text-white'
        }`}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

/** Las cuatro cifras del mes: bolsa, usado, disponible y extra */
export default function MonthSummaryCards({
  summary,
}: {
  summary: MonthSummary;
}) {
  const used = summary.consumedMinutes;
  // Qué parte de la bolsa se ha usado (la barra no pasa del 100 %)
  const share =
    summary.monthlyMinutes > 0
      ? Math.min(100, Math.round((used / summary.monthlyMinutes) * 100))
      : used > 0
        ? 100
        : 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Figure
        label="Bolsa del mes"
        value={formatMinutes(summary.monthlyMinutes)}
        hint={
          summary.monthlyMinutes === 0
            ? 'Fuera de las fechas del contrato'
            : undefined
        }
      />
      <Figure label="Usado" value={formatMinutes(used)}>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700"
          aria-hidden
        >
          <div
            className={`h-full rounded-full ${summary.extraMinutes > 0 ? 'bg-primary-600' : 'bg-primary-500'}`}
            style={{ width: `${share}%` }}
          />
        </div>
      </Figure>
      <Figure
        label="Disponible"
        value={formatMinutes(summary.availableMinutes)}
        hint="No pasa al mes siguiente"
      />
      <Figure
        label="Extra"
        value={formatMinutes(summary.extraMinutes)}
        hint={summary.extraMinutes > 0 ? 'Se cobra aparte' : undefined}
        tone={summary.extraMinutes > 0 ? 'accent' : 'default'}
      />
    </div>
  );
}
