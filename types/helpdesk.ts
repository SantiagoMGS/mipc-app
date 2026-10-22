export type PriorityLevel = 'CRITICA' | 'ALTA' | 'NORMAL' | 'SOLICITUD';
export type TargetUnit = 'HOURS' | 'DAYS';
export type PortalUserRole = 'CLIENT_ADMIN' | 'CLIENT_USER';

export interface ContractPriority {
  id: string;
  level: PriorityLevel;
  criterion: string;
  targetAmount: number;
  targetUnit: TargetUnit;
}

export interface ContractTerms {
  id: string;
  monthlyMinutes: number;
  effectiveFrom: string; // AAAA-MM
}

export interface HelpdeskContract {
  id: string;
  customerId: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  workDays: number[]; // 1=lunes … 7=domingo
  workStart: string;
  workEnd: string;
  priorities: ContractPriority[];
  terms: ContractTerms[];
}

export interface ContractPriorityInput {
  level: PriorityLevel;
  criterion?: string;
  targetAmount?: number;
  targetUnit?: TargetUnit;
}

export interface CreateHelpdeskContractDto {
  customerId: string;
  monthlyHours: number;
  startDate: string;
  endDate?: string;
  workDays?: number[];
  workStart?: string;
  workEnd?: string;
}

export interface UpdateHelpdeskContractDto {
  monthlyHours?: number;
  endDate?: string | null;
  isActive?: boolean;
  workDays?: number[];
  workStart?: string;
  workEnd?: string;
  priorities?: ContractPriorityInput[];
}

export interface PortalUser {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  role: PortalUserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface PortalUserWithPassword extends PortalUser {
  temporaryPassword: string;
}

export interface CreatePortalUserDto {
  name: string;
  email: string;
  phone: string;
  role: PortalUserRole;
}

export interface UpdatePortalUserDto {
  name?: string;
  phone?: string;
  role?: PortalUserRole;
  isActive?: boolean;
}

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  NORMAL: 'Normal',
  SOLICITUD: 'Solicitud',
};

/** De la más urgente a la menos */
export const PRIORITY_LEVELS = Object.keys(PRIORITY_LABELS) as PriorityLevel[];

export const PORTAL_ROLE_LABELS: Record<PortalUserRole, string> = {
  CLIENT_ADMIN: 'Administrador',
  CLIENT_USER: 'Usuario',
};

// ============================================
// Tickets
// ============================================

export type TicketStatus = 'ABIERTO' | 'EN_ATENCION' | 'RESUELTO' | 'CANCELADO';
export type ResponseStatus = 'PENDIENTE' | 'VENCIDO' | 'A_TIEMPO' | 'TARDE';

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  ABIERTO: 'Abierto',
  EN_ATENCION: 'En atención',
  RESUELTO: 'Resuelto',
  CANCELADO: 'Cancelado',
};

export const RESPONSE_STATUS_LABELS: Record<ResponseStatus, string> = {
  PENDIENTE: 'Por vencer',
  VENCIDO: 'Vencidos',
  A_TIEMPO: 'Respondidos a tiempo',
  TARDE: 'Respondidos tarde',
};

export interface ContractCustomer {
  id: string;
  businessName: string | null;
  firstName: string | null;
  lastName: string | null;
}

export interface ContractWithCustomer extends HelpdeskContract {
  customer: ContractCustomer;
}

interface TicketBase {
  id: string;
  number: string;
  customerId: string;
  requesterId: string;
  deviceId: string | null;
  subject: string;
  description: string;
  priority: PriorityLevel;
  receivedAt: string;
  responseDueAt: string;
  status: TicketStatus;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  billableMinutes: number | null;
  isBillable: boolean;
  billingMonth: string | null;
  responseStatus: ResponseStatus;
  createdAt: string;
}

export interface StaffTicketListItem extends TicketBase {
  assignedTechnicianId: string | null;
  createdByStaffId: string | null;
  cancelReason: string | null;
  customer: ContractCustomer;
  requester: { id: string; name: string };
  assignedTechnician: { id: string; name: string } | null;
}

export interface TicketAttachment {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface TicketDevice {
  id: string;
  brand: string | null;
  model: string | null;
  deviceUser: string | null;
  serial: string | null;
  deviceType: { name: string };
}

export type TicketEventType =
  | 'CREATED'
  | 'TAKEN'
  | 'ASSIGNED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'TIMES_CHANGED'
  | 'RESOLVED'
  | 'REOPENED'
  | 'CANCELLED'
  | 'BILLING_CHANGED';

export interface TicketEvent {
  id: string;
  type: TicketEventType;
  data: Record<string, unknown> | null;
  createdAt: string;
  actorUser: { id: string; name: string } | null;
  actorPortalUser: { id: string; name: string } | null;
}

export interface StaffTicketDetail extends Omit<
  StaffTicketListItem,
  'requester'
> {
  requester: { id: string; name: string; email: string; phone: string };
  createdByStaff: { id: string; name: string } | null;
  device: TicketDevice | null;
  attachments: TicketAttachment[];
  events: TicketEvent[];
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface StaffTicketFilters {
  status?: TicketStatus;
  priority?: PriorityLevel;
  customerId?: string;
  assignedTo?: string;
  responseStatus?: ResponseStatus;
  page?: number;
  limit?: number;
}

export interface ResolvedTicketInput {
  firstResponseAt: string;
  resolvedAt: string;
  billableMinutes: number;
  resolutionNote: string;
  isBillable?: boolean;
}

export interface CreateStaffTicketDto {
  customerId: string;
  requesterId: string;
  subject: string;
  description: string;
  priority: PriorityLevel;
  deviceId?: string;
  receivedAt?: string;
  resolved?: ResolvedTicketInput;
}

export interface UpdateTicketDto {
  priority?: PriorityLevel;
  assignedTechnicianId?: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  billableMinutes?: number;
  isBillable?: boolean;
  resolutionNote?: string;
}

export interface ResolveTicketDto {
  billableMinutes: number;
  resolutionNote: string;
  resolvedAt?: string;
}

export interface Holiday {
  date: string; // AAAA-MM-DD
  name: string;
  source: 'API' | 'MANUAL';
  isActive: boolean;
}

// ============================================
// Tickets en el portal
// ============================================

export interface PortalHelpdeskContext {
  hasActiveContract: boolean;
  priorities: {
    level: PriorityLevel;
    criterion: string;
    targetAmount: number;
    targetUnit: TargetUnit;
  }[];
  devices: { id: string; label: string }[];
}

export interface PortalTicketListItem extends TicketBase {
  requester: { id: string; name: string };
  assignedTechnician: { name: string } | null;
}

export interface PortalTicketDetail extends PortalTicketListItem {
  device: TicketDevice | null;
  attachments: TicketAttachment[];
}

export interface CreatePortalTicketDto {
  subject: string;
  description: string;
  priority: PriorityLevel;
  deviceId?: string;
}
