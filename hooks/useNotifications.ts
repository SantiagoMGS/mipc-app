'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/lib/api';
import { NotificationsResponse } from '@/types/helpdesk';

const notificationKeys = { all: ['notifications'] as const };

/** Avisos de la persona; se consultan cada minuto (no hace falta tiempo real) */
export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => notificationsService.list(),
    refetchInterval: 60_000,
    enabled,
  });
}

/** Marca un aviso como leído; el contador baja de una vez */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onMutate: (id) => {
      queryClient.setQueryData<NotificationsResponse>(
        notificationKeys.all,
        (current) => {
          if (!current) return current;
          const target = current.data.find((n) => n.id === id);
          if (!target || target.readAt) return current;
          return {
            data: current.data.map((n) =>
              n.id === id ? { ...n, readAt: new Date().toISOString() } : n
            ),
            unreadCount: Math.max(0, current.unreadCount - 1),
          };
        }
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onMutate: () => {
      const now = new Date().toISOString();
      queryClient.setQueryData<NotificationsResponse>(
        notificationKeys.all,
        (current) =>
          current && {
            data: current.data.map((n) => ({ ...n, readAt: n.readAt ?? now })),
            unreadCount: 0,
          }
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
