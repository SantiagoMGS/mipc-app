/** Enlace para escribir por WhatsApp; un celular colombiano de 10 dígitos lleva 57 */
export function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const international = digits.length === 10 ? `57${digits}` : digits;
  return `https://wa.me/${international}`;
}
