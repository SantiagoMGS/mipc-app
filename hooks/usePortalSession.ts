'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { customerAuthService } from '@/lib/api';
import {
  parsePortalSession,
  portalHomeFor,
  PortalSession,
} from '@/lib/portal-session';

/**
 * Sesión de una persona de una empresa en las páginas de mesa de ayuda.
 * Redirige si no hay sesión, si debe cambiar la contraseña, si es un cliente
 * de reparación, o si la página es solo para el administrador del cliente.
 */
export function usePortalSession(options: { adminOnly?: boolean } = {}) {
  const router = useRouter();
  const { adminOnly = false } = options;
  const [session, setSession] = useState<PortalSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    customerAuthService.validate().then((validation) => {
      if (cancelled) return;
      const current = parsePortalSession(validation);
      const home = portalHomeFor(current);
      if (!current || home !== '/portal/mesa-de-ayuda') {
        router.replace(home);
        return;
      }
      if (adminOnly && current.role !== 'CLIENT_ADMIN') {
        router.replace('/portal/mesa-de-ayuda');
        return;
      }
      setSession(current);
    });
    return () => {
      cancelled = true;
    };
  }, [router, adminOnly]);

  return {
    status: session ? ('ready' as const) : ('loading' as const),
    session,
  };
}
