import { formatMinutes } from '@/lib/format';
import { SELECT_CLASS } from './field-styles';

// De 15 minutos a 12 horas, de 15 en 15
const OPTIONS = Array.from({ length: 48 }, (_, i) => (i + 1) * 15);

interface TimeSelectProps {
  id?: string;
  value: number | null;
  onChange: (minutes: number | null) => void;
}

/** Tiempo dedicado a un ticket: un solo valor, múltiplo de 15 */
export default function TimeSelect({ id, value, onChange }: TimeSelectProps) {
  return (
    <select
      id={id}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className={SELECT_CLASS}
    >
      <option value="">Escoge el tiempo</option>
      {OPTIONS.map((minutes) => (
        <option key={minutes} value={minutes}>
          {formatMinutes(minutes)}
        </option>
      ))}
    </select>
  );
}
