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
