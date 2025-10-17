import {
  ServiceOrderStatus,
  ServiceOrderPriority,
  PaymentStatus,
  STATUS_LABELS,
  PRIORITY_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/types/service-order';

interface StatusBadgeProps {
  status: ServiceOrderStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors: Record<ServiceOrderStatus, string> = {
    RECIBIDO:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    EN_DIAGNOSTICO:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    ESPERANDO_REPUESTOS:
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    EN_REPARACION:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    REPARADO:
      'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
    COMPLETO:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    FACTURADO:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    CANCELADO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    NO_REPARABLE:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: ServiceOrderPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const colors: Record<ServiceOrderPriority, string> = {
    BAJA: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    NORMAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    ALTA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const colors: Record<PaymentStatus, string> = {
    PENDIENTE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    ABONO:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    PAGADO:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}
