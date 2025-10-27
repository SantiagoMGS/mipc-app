export type ServiceOrderStatus =
  | 'RECIBIDO'
  | 'EN_DIAGNOSTICO'
  | 'ESPERANDO_REPUESTOS'
  | 'EN_REPARACION'
  | 'REPARADO'
  | 'COMPLETO'
  | 'FACTURADO'
  | 'CANCELADO'
  | 'NO_REPARABLE';

export type ServiceOrderPriority = 'BAJA' | 'NORMAL' | 'ALTA';

export type PaymentStatus = 'PENDIENTE' | 'ABONO' | 'PAGADO';

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  deviceId: string;
  technicianId: string;
  createdById: string;
  status: ServiceOrderStatus;
  priority: ServiceOrderPriority;
  problemDescription: string;
  observations?: string;
  diagnosticNotes?: string;
  internalNotes?: string; // Notas internas del técnico
  deliveryNotes?: string; // Notas de entrega
  laborCost: number; // Suma de items tipo SERVICIO
  partsCost: number; // Suma de items tipo PRODUCTO
  totalCost: number; // laborCost + partsCost (calculado por backend)
  totalPaid: number;
  balance: number; // totalCost - totalPaid
  paymentStatus: PaymentStatus;
  isDelivered: boolean;
  invoice?: string;
  invoiceNumber?: string; // Número de factura (alias de invoice)
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceOrderDto {
  customerId: string;
  deviceId: string;
  technicianId: string;
  priority?: ServiceOrderPriority;
  problemDescription: string;
  observations?: string;
  estimatedDeliveryDate?: string;
}

export interface UpdateServiceOrderDto {
  diagnosticNotes?: string;
  observations?: string;
  internalNotes?: string;
  deliveryNotes?: string;
  isDelivered?: boolean;
  invoice?: string;
  invoiceNumber?: string;
  totalCost?: number;
  totalPaid?: number;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
}

export interface ChangeStatusDto {
  newStatus: ServiceOrderStatus;
  notes?: string;
}

export interface ServiceOrderFilters {
  status?: ServiceOrderStatus;
  customerId?: string;
  technicianId?: string;
  paymentStatus?: PaymentStatus;
  limit?: number;
  page?: number;
}

// Estados permitidos como transiciones
export const STATUS_TRANSITIONS: Record<
  ServiceOrderStatus,
  ServiceOrderStatus[]
> = {
  RECIBIDO: ['EN_DIAGNOSTICO', 'CANCELADO'],
  EN_DIAGNOSTICO: [
    'ESPERANDO_REPUESTOS',
    'EN_REPARACION',
    'NO_REPARABLE',
    'CANCELADO',
  ],
  ESPERANDO_REPUESTOS: ['EN_REPARACION', 'CANCELADO'],
  EN_REPARACION: ['REPARADO', 'ESPERANDO_REPUESTOS', 'CANCELADO'],
  REPARADO: ['COMPLETO', 'CANCELADO'],
  COMPLETO: ['FACTURADO'],
  FACTURADO: [],
  CANCELADO: [],
  NO_REPARABLE: [],
};

// Labels en español para los estados
export const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  RECIBIDO: 'Recibido',
  EN_DIAGNOSTICO: 'En Diagnóstico',
  ESPERANDO_REPUESTOS: 'Esperando Repuestos',
  EN_REPARACION: 'En Reparación',
  REPARADO: 'Reparado',
  COMPLETO: 'Completo',
  FACTURADO: 'Facturado',
  CANCELADO: 'Cancelado',
  NO_REPARABLE: 'No Reparable',
};

// Labels para prioridades
export const PRIORITY_LABELS: Record<ServiceOrderPriority, string> = {
  BAJA: 'Baja',
  NORMAL: 'Normal',
  ALTA: 'Alta',
};

// Labels para estados de pago
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDIENTE: 'Pendiente',
  ABONO: 'Abono',
  PAGADO: 'Pagado',
};
