'use client';

import { ServiceOrder } from '@/types/service-order';
import { formatCurrency } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ServiceOrderCostsProps {
  order: ServiceOrder;
}

export function ServiceOrderCosts({ order }: ServiceOrderCostsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de Costos</CardTitle>
        <CardDescription>
          Desglose de mano de obra, repuestos y pagos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Mano de Obra */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Mano de Obra:</span>
            <span className="font-medium">
              {formatCurrency(order.laborCost || 0)}
            </span>
          </div>

          {/* Repuestos */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Repuestos:</span>
            <span className="font-medium">
              {formatCurrency(order.partsCost || 0)}
            </span>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-lg font-bold">
              {formatCurrency(order.totalCost || 0)}
            </span>
          </div>

          <Separator />

          {/* Pagado */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Pagado:</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {formatCurrency(order.totalPaid || 0)}
            </span>
          </div>

          {/* Saldo */}
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Saldo:</span>
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
      </CardContent>
    </Card>
  );
}
