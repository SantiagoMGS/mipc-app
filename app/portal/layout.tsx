import type { Metadata, Viewport } from 'next';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

// El portal de clientes es la app instalable (PWA). El manifest no puede
// empezar por /portal: el middleware exige sesión en esas rutas y el
// navegador lo pide sin cookies.
export const metadata: Metadata = {
  title: 'Portal de Clientes - MiPC Tecnología',
  description:
    'Consulta el estado de tus equipos y órdenes de servicio en MiPC Tecnología.',
  applicationName: 'MiPC',
  manifest: '/manifest-portal.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'MiPC',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: { url: '/icons/apple-touch-icon.png', sizes: '180x180' },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Chrome puede ofrecer la instalación antes de que React hidrate: se
          guarda el evento para que InstallAppBanner lo use después */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__mipcInstallPrompt=e;window.dispatchEvent(new Event('mipc-installable'));});`,
        }}
      />
      {children}
      <ServiceWorkerRegistration />
    </>
  );
}
