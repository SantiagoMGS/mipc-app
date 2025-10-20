'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Calendar, FileText, CreditCard, Loader2 } from 'lucide-react';
import { CreatePaymentDto, PaymentMethod, PAYMENT_METHOD_LABELS } from '@/types/payment';
import { formatCurrency } from '@/lib/utils';

interface AddPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePaymentDto) => Promise<void>;
  balance: number;
  isLoading: boolean;
}

export function AddPaymentDialog({
  open,
  onClose,
  onSubmit,
  balance,
  isLoading,
}: AddPaymentDialogProps) {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.EFECTIVO);
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setAmount('');
      setPaymentMethod(PaymentMethod.EFECTIVO);
      setNotes('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setErrors({});
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum)) {
      newErrors.amount = 'El monto es requerido';
    } else if (amountNum <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    } else if (amountNum > balance) {
      newErrors.amount = `El monto no puede exceder el saldo de ${formatCurrency(balance)}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const data: CreatePaymentDto = {
        amount: parseFloat(amount),
        paymentMethod: paymentMethod,
        paymentDate: paymentDate
          ? new Date(paymentDate).toISOString()
          : undefined,
        notes: notes.trim() || undefined,
      };

      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Error submitting payment:', error);
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (errors.amount) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.amount;
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Pago</DialogTitle>
          <DialogDescription>
            Ingresa los detalles del pago recibido
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Monto */}
          <div>
            <Label htmlFor="amount">
              Monto a Pagar <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-2">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="amount"
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className={`pl-10 ${errors.amount ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                {errors.amount}
              </p>
            )}
            {balance > 0 && !errors.amount && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Saldo disponible: {formatCurrency(balance)}
              </p>
            )}
          </div>

          {/* Método de Pago */}
          <div>
            <Label htmlFor="paymentMethod">
              Método de Pago <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-2">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha de Pago */}
          <div>
            <Label htmlFor="paymentDate">Fecha de Pago</Label>
            <div className="relative mt-2">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <div className="relative mt-2">
              <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Agregar notas sobre este pago..."
              />
            </div>
          </div>

          {/* Vista Previa del Total */}
          {amount && !errors.amount && parseFloat(amount) > 0 && (
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total a Registrar:
                </span>
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {formatCurrency(parseFloat(amount))}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!amount || balance <= 0 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Registrar Pago
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
