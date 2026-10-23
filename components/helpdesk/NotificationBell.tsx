'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/useNotifications';
import { formatRelative } from '@/lib/format';

/** Campana del panel: tickets nuevos del portal para ADMIN y TECNICO */
export default function NotificationBell() {
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Se cierra al hacer clic afuera o con Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const unread = data?.unreadCount ?? 0;
  const notifications = data?.data ?? [];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={unread > 0 ? `Avisos (${unread} sin leer)` : 'Avisos'}
        className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span
            data-testid="notification-count"
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1 text-xs font-semibold tabular-nums text-white"
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* En el celular ocupa el ancho de la pantalla; en escritorio cuelga de la campana */}
      {open && (
        <div
          role="dialog"
          aria-label="Avisos"
          className="fixed inset-x-4 top-16 z-50 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="font-semibold text-gray-900 dark:text-white">
              Avisos
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="text-xs font-medium text-primary-700 hover:underline dark:text-primary-400"
              >
                Marcar todo como leído
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No tienes avisos.
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-700">
              {notifications.map((n) => {
                const content = (
                  <>
                    <span
                      className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${n.readAt ? 'bg-transparent' : 'bg-primary-500'}`}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span
                        className={`block text-sm break-words ${n.readAt ? 'text-gray-600 dark:text-gray-400' : 'font-medium text-gray-900 dark:text-white'}`}
                      >
                        {n.title}
                      </span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        {formatRelative(n.createdAt)}
                      </span>
                    </span>
                  </>
                );
                const className =
                  'flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50';
                return (
                  <li key={n.id}>
                    {n.ticketId ? (
                      <Link
                        href={`/dashboard/mesa-de-ayuda/${n.ticketId}`}
                        onClick={() => {
                          if (!n.readAt) markRead.mutate(n.id);
                          setOpen(false);
                        }}
                        className={className}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className={className}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
