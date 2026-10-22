'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    // Lo guarda el script en línea de app/portal/layout.tsx
    __mipcInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

const DISMISSED_KEY = 'mipcInstallBannerDismissed';

interface InstallAppBannerProps {
  /** banner: tarjeta descartable en el portal; inline: botón bajo el login */
  variant?: 'banner' | 'inline';
}

/**
 * Ofrece instalar el portal como app. En Android/Chrome usa el diálogo nativo
 * del navegador; en iPhone, que no lo tiene, explica cómo hacerlo a mano.
 * No se muestra si la app ya está instalada.
 */
export default function InstallAppBanner({
  variant = 'banner',
}: InstallAppBannerProps) {
  const { toast } = useToast();
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    if (variant === 'banner') {
      try {
        if (localStorage.getItem(DISMISSED_KEY) === '1') return;
      } catch {
        // Sin acceso a localStorage: se muestra igual
      }
    }

    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setPromptEvent(window.__mipcInstallPrompt ?? null);
    setIsVisible(true);

    const handleInstallable = () =>
      setPromptEvent(window.__mipcInstallPrompt ?? null);
    const handleInstalled = () => {
      window.__mipcInstallPrompt = null;
      setIsVisible(false);
    };
    window.addEventListener('mipc-installable', handleInstallable);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('mipc-installable', handleInstallable);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [variant]);

  if (!isVisible || (!promptEvent && !isIos)) return null;

  const handleInstall = async () => {
    if (!promptEvent) {
      toast({
        title: 'Instalar en iPhone',
        description:
          'Toca el botón Compartir de Safari y luego "Agregar a inicio".',
      });
      return;
    }
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    // El diálogo nativo solo se puede abrir una vez por evento
    window.__mipcInstallPrompt = null;
    setPromptEvent(null);
    if (outcome === 'accepted') setIsVisible(false);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Sin acceso a localStorage: solo se oculta en esta visita
    }
    setIsVisible(false);
  };

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleInstall}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Download className="w-5 h-5" />
        Instalar la app en tu celular
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
      <Image
        src="/icons/icon-192.png"
        alt=""
        width={40}
        height={40}
        className="rounded-lg border border-gray-100 dark:border-gray-700 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-white">
          Instala la app de MiPC
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Abre tu portal con un toque desde la pantalla de inicio.
        </p>
      </div>
      <button
        type="button"
        onClick={handleInstall}
        className="flex-shrink-0 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Instalar
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="No mostrar de nuevo"
        title="No mostrar de nuevo"
        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
