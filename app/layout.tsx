import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MIPC - Sistema de Gestión',
  description: 'Sistema de gestión de órdenes de servicio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
