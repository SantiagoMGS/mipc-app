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

export const PORTAL_ROLE_LABELS: Record<PortalUserRole, string> = {
  CLIENT_ADMIN: 'Administrador',
  CLIENT_USER: 'Usuario',
};
