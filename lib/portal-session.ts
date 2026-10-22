import { PortalUserRole } from '@/types/helpdesk';

export interface PortalSession {
  type: 'customer' | 'portal-user';
  portalUserId?: string;
  role?: PortalUserRole;
  name: string;
  customerId: string;
  mustChangePassword: boolean;
}

/** Respuesta de /customer-auth/validate convertida en sesión (null si no vale) */
export function parsePortalSession(validation: any): PortalSession | null {
  if (!validation?.valid) return null;
  if (validation.type === 'portal-user') {
    const user = validation.portalUser;
    return {
      type: 'portal-user',
      portalUserId: user.id,
      role: user.role,
      name: user.name,
      customerId: user.customerId,
      mustChangePassword: !!user.mustChangePassword,
    };
  }
  return {
    type: 'customer',
    name: validation.customer?.name ?? '',
    customerId: validation.customer?.id,
    mustChangePassword: !!validation.customer?.mustChangePassword,
  };
}

/** Página de inicio según el tipo de sesión */
export function portalHomeFor(session: PortalSession | null): string {
  if (!session) return '/portal/login';
  if (session.mustChangePassword) return '/portal/cambiar-clave';
  return session.type === 'portal-user' ? '/portal/mesa-de-ayuda' : '/portal';
}
