export enum PaymentStatus {
  PENDIENTE = 'PENDIENTE',
  ABONO = 'ABONO',
  PAGADO = 'PAGADO',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDIENTE]: 'Pendiente',
  [PaymentStatus.ABONO]: 'Abono',
  [PaymentStatus.PAGADO]: 'Pagado',
};

export interface Payment {
  id: string;
  serviceOrderId: string;
  amount: number;
  notes?: string;
  paymentDate: string;
  createdAt: string;
}

export interface CreatePaymentDto {
  amount: number;
  notes?: string;
  paymentDate?: string;
}

export interface PaymentResponse {
  payment: Payment;
  order: {
    id: string;
    orderNumber: string;
    totalCost: number;
    totalPaid: number;
    balance: number;
    paymentStatus: PaymentStatus;
  };
}
