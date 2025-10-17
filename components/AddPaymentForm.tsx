'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Calendar, FileText } from 'lucide-react';
import { CreatePaymentDto } from '@/types/payment';

interface AddPaymentFormProps {
  balance: number;
  isBlocked: boolean;
  onSubmit: (data: CreatePaymentDto) => Promise<void>;
  isLoading: boolean;
}

export function AddPaymentForm({
  balance,
  isBlocked,
  onSubmit,
  isLoading,
}: AddPaymentFormProps) {
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum)) {
      newErrors.amount = 'El monto es requerido';
    } else if (amountNum <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    } else if (amountNum > balance) {
      newErrors.amount = `El monto no puede exceder el saldo de $${balance.toLocaleString(
        'es-CO'
      )}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const data: CreatePaymentDto = {
        amount: parseFloat(amount),
        paymentDate: paymentDate
          ? new Date(paymentDate).toISOString()
          : undefined,
        notes: notes.trim() || undefined,
      };

      await onSubmit(data);

      // Limpiar formulario
      setAmount('');
      setNotes('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setErrors({});
    } catch (error) {
      // El error ya se maneja en el hook
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

  const isDisabled = isBlocked || balance <= 0 || isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              disabled={isDisabled}
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
              Saldo disponible: ${balance.toLocaleString('es-CO')}
            </p>
          )}
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
              disabled={isDisabled}
              className="pl-10"
            />
          </div>
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
            disabled={isDisabled}
            rows={3}
            className="block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Agregar notas sobre este pago..."
          />
        </div>
      </div>

      {/* Botón de Submit */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isDisabled}
          className="flex items-center gap-2"
        >
          <DollarSign className="w-5 h-5" />
          {isLoading ? 'Registrando...' : 'Registrar Pago'}
        </Button>
      </div>
    </form>
  );
}
