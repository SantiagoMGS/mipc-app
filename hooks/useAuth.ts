'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/lib/api';
import { isTokenExpired } from '@/lib/auth-utils';

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const goToLogin = () => {
      setIsAuthenticated(false);
      setIsLoading(false);
      // Solo redirigir si no estamos en login
      if (pathname !== '/login') {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    };

    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');

      if (token && !isTokenExpired(token)) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // El access token venció (dura minutos) o no está: se renueva con el
      // refresh token de la cookie. Solo si la sesión terminó se va al login.
      const result = await authService.refresh();
      if (result.status === 'ok') {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      if (result.status === 'expired') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
      goToLogin();
    };

    checkAuth();
  }, [router, pathname]);

  return { isAuthenticated, isLoading };
}
