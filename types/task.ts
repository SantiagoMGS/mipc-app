// ==================== Task Types ====================

export interface TaskItem {
  id: string;
  taskId: string;
  name: string;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  customer: string;
  description: string;
  isDone: boolean;
  hasInvoice: boolean;
  createdAt: string;
  updatedAt: string;
  taskItems?: TaskItem[];
}

// ==================== DTOs ====================

export interface CreateTaskItemDto {
  name: string;
  quantity: number;
  price: number;
}

export interface CreateTaskDto {
  customer: string;
  description: string;
  isDone?: boolean;
  hasInvoice?: boolean;
  items?: CreateTaskItemDto[];
}

export interface UpdateTaskDto {
  customer?: string;
  description?: string;
  isDone?: boolean;
  hasInvoice?: boolean;
  items?: CreateTaskItemDto[];
}

export interface TaskFilters {
  page?: number;
  limit?: number;
  customer?: string;
  description?: string;
  isDone?: boolean;
  hasInvoice?: boolean;
}

export interface PaginatedTasks {
  data: Task[];
  total: number;
  page: number;
  limit: number;
}
