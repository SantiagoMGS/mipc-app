/** 1110 → "18 h 30 min"; 45 → "45 min"; 1080 → "18 h" */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** Mes actual 'AAAA-MM' en Bogotá (UTC−5, sin horario de verano) */
export function currentBogotaMonth(now: Date = new Date()): string {
  return new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString().slice(0, 7);
}

/** Fecha de un contrato (medianoche de Bogotá) como "1 nov 2026" */
export function formatBogotaDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Valor para un <input type="datetime-local"> con la hora de Bogotá */
export function bogotaInputValue(date: Date = new Date()): string {
  return new Date(date.getTime() - BOGOTA_OFFSET_MS).toISOString().slice(0, 16);
}

/** 'AAAA-MM-DDTHH:mm' escrito en hora de Bogotá → ISO con su zona */
export function bogotaInputToIso(value: string): string {
  return `${value}:00-05:00`;
}

/** "22 oct 2026, 3:30 p. m." en hora de Bogotá */
export function formatBogotaDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Duración corta: "45 min", "1 h 20 min", "3 d 4 h" */
export function formatDuration(minutes: number): string {
  if (minutes < 24 * 60) return formatMinutes(minutes);
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  return hours === 0 ? `${days} d` : `${days} d ${hours} h`;
}

/** Nombre de un cliente: razón social o nombre y apellido */
export function customerName(customer: {
  businessName: string | null;
  firstName: string | null;
  lastName: string | null;
}): string {
  return (
    customer.businessName ||
    [customer.firstName, customer.lastName].filter(Boolean).join(' ') ||
    'Sin nombre'
  );
}

/** Fecha de un contrato en palabras: "1 de noviembre de 2026" */
export function formatBogotaLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Suma (o resta) meses a 'AAAA-MM' */
export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number);
  const index = year * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

/** 'AAAA-MM' → "Septiembre de 2026" */
export function formatMonth(month: string): string {
  const label = new Date(`${month}-15T12:00:00Z`).toLocaleDateString('es-CO', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "hace 5 minutos", "ayer"… */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const minutes = Math.round((new Date(iso).getTime() - now) / 60_000);
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  return rtf.format(Math.round(hours / 24), 'day');
}
