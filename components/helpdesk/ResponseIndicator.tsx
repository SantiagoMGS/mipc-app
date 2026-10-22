'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { formatDuration } from '@/lib/format';
import { TicketStatus } from '@/types/helpdesk';

interface ResponseIndicatorProps {
  ticket: {
    status: TicketStatus;
    responseDueAt: string;
    firstResponseAt: string | null;
  };
}

// Se vuelve a pintar cada minuto para que la cuenta no se quede quieta
function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/** Cuánto falta para vencer la respuesta, o si se respondió a tiempo */
export default function ResponseIndicator({ ticket }: ResponseIndicatorProps) {
  const now = useNow();
  const due = new Date(ticket.responseDueAt).getTime();

  if (ticket.firstResponseAt) {
    const onTime = new Date(ticket.firstResponseAt).getTime() <= due;
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium ${onTime ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden />
        {onTime ? 'Respondido a tiempo' : 'Respondido tarde'}
      </span>
    );
  }
  if (ticket.status === 'CANCELADO') {
    return <span className="text-xs text-gray-400">Sin respuesta</span>;
  }

  const minutes = Math.round((due - now) / 60_000);
  if (minutes < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400">
        <AlertTriangle className="w-3.5 h-3.5" aria-hidden />
        Vencido hace {formatDuration(Math.max(1, -minutes))}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${minutes < 60 ? 'text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}
    >
      <Clock className="w-3.5 h-3.5" aria-hidden />
      Vence en {formatDuration(Math.max(1, minutes))}
    </span>
  );
}
