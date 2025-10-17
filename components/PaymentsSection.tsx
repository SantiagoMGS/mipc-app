'use client';

import { useMemo } from 'react';
import { usePayments } from '@/hooks/usePayments';
import { AddPaymentForm } from './AddPaymentForm';
import { PaymentsList } from './PaymentsList';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PaymentStatus, PAYMENT_STATUS_LABELS } from '@/types/payment';
import { DollarSign, TrendingUp, Wallet, AlertCircle, Ban } from 'lucide-react';

interface PaymentsSectionProps {
  serviceOrderId: string;
  orderStatus: string;
  totalCost: number;
  initialTotalPaid: number;
  initialPaymentStatus: PaymentStatus;
}

export function PaymentsSection({
  serviceOrderId,
  orderStatus,
  totalCost,
  initialTotalPaid,
  initialPaymentStatus,
}: PaymentsSectionProps) {
  const {
    payments,
    isLoading,
    addPayment,
    removePayment,
    isAddingPayment,
    isRemovingPayment,
  } = usePayments(serviceOrderId);

  // Calcular totales actuales
  const { totalPaid, balance, paymentStatus } = useMemo(() => {
    const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const bal = totalCost - paid;

    let status: PaymentStatus;
    if (paid === 0) {
      status = PaymentStatus.PENDIENTE;
    } else if (paid >= totalCost) {
      status = PaymentStatus.PAGADO;
    } else {
      status = PaymentStatus.ABONO;
    }

    return {
      totalPaid: paid,
      balance: bal,
      paymentStatus: status,
    };
  }, [payments, totalCost]);

  // Verificar si el estado está bloqueado
  const isBlocked =
    orderStatus === 'CANCELADO' || orderStatus === 'NO_REPARABLE';

  // Colores del badge según el estado de pago
  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAGADO:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case PaymentStatus.ABONO:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case PaymentStatus.PENDIENTE:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con Badge de Estado */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Gestión de Pagos
        </h2>
        <Badge
          className={`text-sm px-4 py-2 ${getPaymentStatusColor(
            paymentStatus
          )}`}
        >
          {PAYMENT_STATUS_LABELS[paymentStatus]}
        </Badge>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total a Cobrar
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${totalCost.toLocaleString('es-CO')}
              </p>
            </div>
          </div>
        </div>

        {/* Pagado */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Pagado
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${totalPaid.toLocaleString('es-CO')}
              </p>
            </div>
          </div>
        </div>

        {/* Saldo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Wallet className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Saldo Pendiente
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                ${balance.toLocaleString('es-CO')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert si está bloqueado */}
      {isBlocked && (
        <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <Ban className="w-5 h-5 text-red-500 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            No se pueden agregar pagos a órdenes con estado{' '}
            <span className="font-semibold">{orderStatus}</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Alert si el saldo es 0 */}
      {!isBlocked && balance <= 0 && (
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <AlertCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            Esta orden ya ha sido pagada en su totalidad
          </AlertDescription>
        </Alert>
      )}

      {/* Formulario para Agregar Pago */}
      {!isBlocked && balance > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Registrar Nuevo Pago
          </h3>
          <AddPaymentForm
            balance={balance}
            isBlocked={isBlocked}
            onSubmit={async (data) => {
              await addPayment(data);
            }}
            isLoading={isAddingPayment}
          />
        </div>
      )}

      {/* Lista de Pagos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Historial de Pagos
        </h3>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Cargando pagos...
            </p>
          </div>
        ) : (
          <PaymentsList
            payments={payments}
            onDelete={async (paymentId) => {
              await removePayment(paymentId);
            }}
            isDeleting={isRemovingPayment}
          />
        )}
      </div>
    </div>
  );
}
