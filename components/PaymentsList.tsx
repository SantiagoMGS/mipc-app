'use client';

import { useState } from 'react';
import { Payment, PaymentMethod, PAYMENT_METHOD_LABELS } from '@/types/payment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, Calendar, DollarSign, FileText, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PaymentsListProps {
  payments: Payment[];
  onDelete: (paymentId: string) => Promise<void>;
  isDeleting: boolean;
}

export function PaymentsList({
  payments,
  onDelete,
  isDeleting,
}: PaymentsListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const handleDeleteClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedPayment) {
      try {
        await onDelete(selectedPayment.id);
        setDeleteDialogOpen(false);
        setSelectedPayment(null);
      } catch (error) {
        // El error ya se maneja en el hook
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  const getPaymentMethodBadgeClass = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.EFECTIVO:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case PaymentMethod.TRANSFERENCIA:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          No hay pagos registrados
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Los pagos que registres aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha de Pago
                </div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Método
                </div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Monto
                </div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notas
                </div>
              </TableHead>
              <TableHead className="text-right text-gray-700 dark:text-gray-300">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium text-gray-900 dark:text-white">
                  {formatDate(payment.paymentDate)}
                </TableCell>
                <TableCell>
                  <Badge className={getPaymentMethodBadgeClass(payment.paymentMethod)}>
                    {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-900 dark:text-white">
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    ${payment.amount.toLocaleString('es-CO')}
                  </span>
                </TableCell>
                <TableCell className="text-gray-600 dark:text-gray-400">
                  {payment.notes || (
                    <span className="italic text-gray-400 dark:text-gray-500">
                      Sin notas
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(payment)}
                    disabled={isDeleting}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              ¿Estás seguro de que deseas eliminar este pago?
              {selectedPayment && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                  <p className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Monto:
                    </span>{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${selectedPayment.amount.toLocaleString('es-CO')}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Método:
                    </span>{' '}
                    <span className="text-gray-900 dark:text-white">
                      {PAYMENT_METHOD_LABELS[selectedPayment.paymentMethod]}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Fecha:
                    </span>{' '}
                    <span className="text-gray-900 dark:text-white">
                      {formatDate(selectedPayment.paymentDate)}
                    </span>
                  </p>
                  {selectedPayment.notes && (
                    <p className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Notas:
                      </span>{' '}
                      <span className="text-gray-900 dark:text-white">
                        {selectedPayment.notes}
                      </span>
                    </p>
                  )}
                </div>
              )}
              <p className="mt-4 text-sm text-yellow-700 dark:text-yellow-400">
                Esta acción recalculará el saldo de la orden de servicio.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Eliminando...' : 'Eliminar Pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
