/** WhatsApp de MiPC (soporte) */
export const MIPC_WHATSAPP = '573148889078';

/** Enlace para escribirle a MiPC con un mensaje ya escrito */
export function mipcWhatsappLink(message: string): string {
  return `https://wa.me/${MIPC_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
