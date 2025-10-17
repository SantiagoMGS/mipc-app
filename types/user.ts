export enum UserRole {
  ADMIN = 'ADMIN',
  TECNICO = 'TECNICO',
  AUXILIAR = 'AUXILIAR',
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.TECNICO]: 'Técnico',
  [UserRole.AUXILIAR]: 'Auxiliar',
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: UserRole;
  withDeleted?: boolean;
}
