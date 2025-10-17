'use client';

import { ServiceOrder } from '@/types/service-order';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface ServiceOrderCostsProps {
  order: ServiceOrder;
}

export function ServiceOrderCosts({ order }: ServiceOrderCostsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Resumen de Costos
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Desglose de mano de obra, repuestos y pagos
        </p>
      </div>
      <div className="px-6 pb-6">
        <div className="space-y-3">
          {/* Mano de Obra */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Mano de Obra:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(order.laborCost || 0)}
            </span>
          </div>

          {/* Repuestos */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Repuestos:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(order.partsCost || 0)}
            </span>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-800 dark:text-white">Total:</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(order.totalCost || 0)}
            </span>
          </div>

          <Separator />

          {/* Pagado */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Pagado:</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {formatCurrency(order.totalPaid || 0)}
            </span>
          </div>

          {/* Saldo */}
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-800 dark:text-white">Saldo:</span>
            <span
              className={`text-lg font-bold ${
                order.balance > 0
                  ? 'text-red-600 dark:text-red-400'
                  : order.balance < 0
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              {formatCurrency(order.balance || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
