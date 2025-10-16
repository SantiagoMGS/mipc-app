'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('authToken');

        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          // Solo redirigir si no estamos en login
          if (pathname !== '/login') {
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
          }
          return;
        }

        // Verificar si el token es válido (formato básico)
        // En un escenario real, podrías decodificar el JWT y verificar la expiración
        try {
          // Intentar parsear el token JWT (si es JWT)
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            // Es un JWT válido en formato
            const payload = JSON.parse(atob(tokenParts[1]));

            // Verificar si el token ha expirado
            if (payload.exp) {
              const expirationTime = payload.exp * 1000; // Convertir a milisegundos
              const currentTime = Date.now();

              if (currentTime > expirationTime) {
                // Token expirado
                console.warn('Token expirado, redirigiendo a login');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                document.cookie = 'authToken=; path=/; max-age=0';
                setIsAuthenticated(false);
                setIsLoading(false);
                if (pathname !== '/login') {
                  router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
                }
                return;
              }
            }
          }
        } catch (parseError) {
          // Si no se puede parsear, asumir que es un token opaco válido
          console.log('Token opaco detectado, continuando...');
        }

        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        setIsAuthenticated(false);
        setIsLoading(false);
        if (pathname !== '/login') {
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
      }
    };

    checkAuth();
  }, [router, pathname]);

  return { isAuthenticated, isLoading };
}
