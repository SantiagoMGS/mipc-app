import { HelpdeskContract, TargetUnit } from '@/types/helpdesk';
import { currentBogotaMonth } from './format';

const DAY_NAMES = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
];

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "07:00" → "7:00" */
function formatTime(time: string): string {
  return time.replace(/^0(\d)/, '$1');
}

/** [1,2,3,4,5], "07:00", "17:00" → "Lunes a viernes, 7:00 a 17:00" */
export function formatSchedule(
  workDays: number[],
  workStart: string,
  workEnd: string
): string {
  const days = [...workDays].sort((a, b) => a - b);
  const consecutive = days.every(
    (day, i) => i === 0 || day === days[i - 1] + 1
  );
  let label: string;
  if (days.length === 1) {
    label = DAY_NAMES[days[0] - 1];
  } else if (consecutive && days.length > 2) {
    label = `${DAY_NAMES[days[0] - 1]} a ${DAY_NAMES[days[days.length - 1] - 1]}`;
  } else {
    const names = days.map((day) => DAY_NAMES[day - 1]);
    label = `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
  }
  return `${capitalize(label)}, ${formatTime(workStart)} a ${formatTime(workEnd)}`;
}

/** 2 HOURS → "Hasta 2 horas hábiles"; 1 DAYS → "Hasta 1 día hábil" */
export function formatTarget(amount: number, unit: TargetUnit): string {
  if (unit === 'DAYS')
    return `Hasta ${amount} ${amount === 1 ? 'día hábil' : 'días hábiles'}`;
  return `Hasta ${amount} ${amount === 1 ? 'hora hábil' : 'horas hábiles'}`;
}

/** Términos vigentes este mes (o los primeros si el contrato aún no empieza) */
export function currentTerms(contract: HelpdeskContract) {
  const month = currentBogotaMonth();
  const sorted = [...contract.terms].sort((a, b) =>
    a.effectiveFrom.localeCompare(b.effectiveFrom)
  );
  return (
    [...sorted].reverse().find((t) => t.effectiveFrom <= month) ?? sorted[0]
  );
}

/** Próximo cambio de horas ya programado, si lo hay */
export function upcomingTerms(contract: HelpdeskContract) {
  const current = currentTerms(contract);
  return contract.terms
    .filter((t) => t.effectiveFrom > (current?.effectiveFrom ?? ''))
    .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))[0];
}
