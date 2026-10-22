/** Mensaje de error de la API (texto o lista de validaciones) */
export function apiErrorMessage(error: any, fallback: string): string {
  const message = error?.response?.data?.message;
  return Array.isArray(message) ? message.join(', ') : message || fallback;
}
