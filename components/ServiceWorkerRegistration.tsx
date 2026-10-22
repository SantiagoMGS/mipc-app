'use client';

import { useEffect } from 'react';

/**
 * Registra el service worker del portal (PWA).
 * Solo en producción: en desarrollo serviría archivos viejos de la caché.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/portal' })
      .catch((error) => {
        console.error('Error al registrar el service worker:', error);
      });
  }, []);

  return null;
}
