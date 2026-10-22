'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Headset, Laptop, LogOut, Users } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { customerAuthService } from '@/lib/api';
import { PortalSession } from '@/lib/portal-session';

interface NavItem {
  href: string;
  label: string;
  icon: typeof Headset;
}

function navItems(session: PortalSession): NavItem[] {
  const items: NavItem[] = [
    { href: '/portal/mesa-de-ayuda', label: 'Mesa de ayuda', icon: Headset },
  ];
  if (session.role === 'CLIENT_ADMIN') {
    items.push(
      { href: '/portal', label: 'Equipos', icon: Laptop },
      { href: '/portal/usuarios', label: 'Usuarios', icon: Users }
    );
  }
  return items;
}

function isActive(pathname: string, href: string): boolean {
  return href === '/portal'
    ? pathname === '/portal'
    : pathname.startsWith(href);
}

/**
 * Marco del portal para las personas de una empresa con mesa de ayuda:
 * encabezado y menú (abajo en el celular, como una app; arriba en escritorio).
 */
export default function PortalShell({
  session,
  children,
}: {
  session: PortalSession;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = navItems(session);

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Image
              src="/logo_mipc_tec.png"
              alt="MIPC Tecnología"
              width={72}
              height={35}
              className="object-contain"
            />
            <div className="min-w-0">
              <p className="text-base font-bold text-gray-800 dark:text-white truncate">
                Portal de Clientes
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {session.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => customerAuthService.logout()}
              aria-label="Salir"
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
        <nav
          aria-label="Portal"
          className="hidden md:block border-t border-gray-100 dark:border-gray-700"
        >
          <div className="max-w-6xl mx-auto px-6 flex gap-1">
            {items.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(pathname, href) ? 'page' : undefined}
                className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive(pathname, href)
                    ? 'border-primary-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">{children}</main>

      <nav
        aria-label="Portal"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-[env(safe-area-inset-bottom)]"
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
          }}
        >
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-2 text-xs font-medium ${
                isActive(pathname, href)
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

/** Pantalla mientras se valida la sesión */
export function PortalLoading() {
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-500"
        aria-label="Cargando"
      />
    </div>
  );
}
