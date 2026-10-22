import axios from 'axios';
import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';

// ============================================
// Configuración de URL de la API
// ============================================

/**
 * Determina la URL base de la API según el entorno
 *
 * Prioridad:
 * 1. Variable de entorno NEXT_PUBLIC_API_URL (si está definida)
 * 2. Auto-detección basada en hostname:
 *    - localhost → http://localhost:3050
 *    - vercel/producción → https://mipc-api-production.up.railway.app
 */
const getApiBaseUrl = (): string => {
  // 1. Si hay variable de entorno definida, usarla
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 2. Auto-detección basada en el entorno
  // En el servidor (SSR), usar producción por defecto
  if (typeof window === 'undefined') {
    return 'https://mipc-api-production.up.railway.app';
  }

  // 3. En el cliente, detectar según el hostname
  const hostname = window.location.hostname;

  // Desarrollo local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3050';
  }

  // Producción (Vercel u otro hosting)
  return 'https://mipc-api-production.up.railway.app';
};

// URLs disponibles (para referencia y compatibilidad)
export const API_URLS = {
  production: 'https://mipc-api-production.up.railway.app',
  local: 'http://localhost:3050',
};

export const API_BASE_URL = getApiBaseUrl();

// Instancia de axios configurada
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Importante: enviar cookies en cada petición
});

// ============================================
// Renovación de sesión (refresh token)
// ============================================

// El access token dura minutos. El refresh token vive en una cookie httpOnly
// que la API cambia por uno nuevo en cada renovación. Si varias peticiones
// reciben 401 a la vez, todas esperan la misma renovación.
type SessionKind = 'staff' | 'customer';

const SESSION_STORAGE = {
  staff: { refreshPath: '/auth/refresh', tokenKey: 'authToken', nameKey: null },
  customer: {
    refreshPath: '/customer-auth/refresh',
    tokenKey: 'customerToken',
    nameKey: 'customerName',
  },
} as const;

export type RefreshResult =
  | { status: 'ok'; accessToken: string }
  // La sesión terminó (venció, se cerró o se cambió la contraseña)
  | { status: 'expired' }
  // Sin red o con la API caída: la sesión se conserva para reintentar
  | { status: 'error' };

const pendingRefresh: Partial<Record<SessionKind, Promise<RefreshResult>>> = {};

export function refreshSession(kind: SessionKind): Promise<RefreshResult> {
  const pending = pendingRefresh[kind];
  if (pending) return pending;

  const storage = SESSION_STORAGE[kind];
  const refresh = axios
    .post(
      `${API_BASE_URL}${storage.refreshPath}`,
      {},
      { withCredentials: true }
    )
    .then((response): RefreshResult => {
      localStorage.setItem(storage.tokenKey, response.data.accessToken);
      if (storage.nameKey) {
        localStorage.setItem(storage.nameKey, response.data.name);
      }
      return { status: 'ok', accessToken: response.data.accessToken };
    })
    .catch((error: AxiosError): RefreshResult =>
      error.response?.status === 401
        ? { status: 'expired' }
        : { status: 'error' }
    )
    .finally(() => {
      delete pendingRefresh[kind];
    });

  pendingRefresh[kind] = refresh;
  return refresh;
}

/**
 * fetch a la API con la sesión indicada, para descargar archivos (PDF).
 * Si el access token venció, renueva la sesión y repite una vez.
 */
async function fetchWithSession(
  kind: SessionKind,
  path: string
): Promise<Response> {
  const request = () => {
    const token = localStorage.getItem(SESSION_STORAGE[kind].tokenKey);
    return fetch(`${API_BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
  };

  const response = await request();
  if (response.status !== 401) return response;

  const result = await refreshSession(kind);
  return result.status === 'ok' ? request() : response;
}

/**
 * Ante un 401 renueva la sesión y repite la petición una vez. Solo si la
 * sesión ya no existe llama a onExpired (que manda al login).
 */
function retryAfterRefresh(
  instance: AxiosInstance,
  kind: SessionKind,
  skipPaths: string[],
  onExpired: () => void
) {
  return async (error: AxiosError) => {
    const original = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const url = original?.url || '';

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      skipPaths.some((path) => url.includes(path))
    ) {
      return Promise.reject(error);
    }

    original._retry = true;
    const result = await refreshSession(kind);
    if (result.status === 'ok') {
      original.headers.Authorization = `Bearer ${result.accessToken}`;
      return instance(original);
    }
    if (result.status === 'expired') {
      onExpired();
    }
    return Promise.reject(error);
  };
}

// Interceptor para agregar el token a las peticiones (fallback para compatibilidad)
api.interceptors.request.use(
  (config) => {
    // Solo agregar header si existe token en localStorage (para retrocompatibilidad)
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación: renueva la sesión y, si
// ya no existe, manda al login. El 401 del propio login (contraseña errada) no
// recarga la página, para que se vea el mensaje de error.
api.interceptors.response.use(
  (response) => response,
  retryAfterRefresh(
    api,
    'staff',
    ['/auth/login', '/auth/refresh', '/auth/logout'],
    () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  )
);

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    // El servidor ahora establece la cookie httpOnly automáticamente
    // Ya no necesitamos guardar el token en localStorage (más seguro)
    // Pero lo mantenemos temporalmente para compatibilidad
    if (response.data.accessToken) {
      localStorage.setItem('authToken', response.data.accessToken);
    }
    return response.data;
  },

  logout: async () => {
    try {
      // Llamar al endpoint de logout para limpiar la cookie httpOnly
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      // Limpiar localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      window.location.href = '/login';
    }
  },

  /** Renueva la sesión con el refresh token (cookie httpOnly) */
  refresh: () => refreshSession('staff'),

  // Validar token actual
  validateToken: async () => {
    try {
      const response = await api.get('/auth/validate');
      return response.data;
    } catch (error) {
      return null;
    }
  },

  // Obtener la URL actual de la API
  getCurrentURL: () => {
    return api.defaults.baseURL;
  },
};

// Servicios para Items/Productos
export const itemsService = {
  // Obtener todos los items con paginación
  getAll: async (params?: {
    limit?: number;
    page?: number;
    withDeleted?: boolean;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.search) queryParams.append('search', params.search);
    // Solo enviar withDeleted si es true
    if (params?.withDeleted === true) {
      queryParams.append('withDeleted', 'true');
    }

    const url = `/items${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await api.get(url);
    return response.data;
  },

  // Obtener un item por ID
  getById: async (id: string) => {
    const response = await api.get(`/items/${id}`);
    return response.data;
  },

  // Crear un nuevo item
  create: async (data: any) => {
    const response = await api.post('/items', data);
    return response.data;
  },

  // Actualizar un item
  update: async (id: string, data: any) => {
    const response = await api.patch(`/items/${id}`, data);
    return response.data;
  },

  // Eliminar un item
  delete: async (id: string) => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  },

  // Reactivar un item (cambiar isActive a true)
  reactivate: async (id: string) => {
    const response = await api.patch(`/items/${id}`, { isActive: true });
    return response.data;
  },
};

// Servicios para Customers/Clientes
export const customersService = {
  // Obtener todos los clientes con paginación y búsqueda
  getAll: async (params?: {
    limit?: number;
    page?: number;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.search) queryParams.append('search', params.search);

    const url = `/customers${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await api.get(url);
    return response.data;
  },

  // Obtener un cliente por ID
  getById: async (id: string) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Crear un nuevo cliente
  create: async (data: any) => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  // Actualizar un cliente
  update: async (id: string, data: any) => {
    const response = await api.patch(`/customers/${id}`, data);
    return response.data;
  },

  // Eliminar un cliente
  delete: async (id: string) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  // Buscar clientes (para autocompletado)
  search: async (params: { q: string; limit?: number }) => {
    const queryParams = new URLSearchParams();
    queryParams.append('q', params.q);
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(
      `/customers/search?${queryParams.toString()}`
    );
    return response.data;
  },

  // Asignar contraseña a un cliente para el portal
  setPassword: async (customerId: string, password: string) => {
    const response = await api.post('/customer-auth/set-password', {
      customerId,
      password,
    });
    return response.data;
  },
};

// Servicios para Device Types/Tipos de Dispositivo
export const deviceTypesService = {
  // Obtener todos los tipos de dispositivo con paginación
  getAll: async (params?: {
    limit?: number;
    page?: number;
    withDeleted?: boolean;
  }) => {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    // Solo enviar withDeleted si es true
    if (params?.withDeleted === true) {
      queryParams.append('withDeleted', 'true');
    }

    const url = `/device-types${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await api.get(url);
    return response.data;
  },

  // Obtener un tipo de dispositivo por ID
  getById: async (id: string) => {
    const response = await api.get(`/device-types/${id}`);
    return response.data;
  },

  // Crear un nuevo tipo de dispositivo
  create: async (data: any) => {
    const response = await api.post('/device-types', data);
    return response.data;
  },

  // Actualizar un tipo de dispositivo
  update: async (id: string, data: any) => {
    const response = await api.patch(`/device-types/${id}`, data);
    return response.data;
  },

  // Eliminar un tipo de dispositivo
  delete: async (id: string) => {
    const response = await api.delete(`/device-types/${id}`);
    return response.data;
  },

  // Reactivar un tipo de dispositivo (cambiar isActive a true)
  reactivate: async (id: string) => {
    const response = await api.patch(`/device-types/${id}`, { isActive: true });
    return response.data;
  },
};

// Servicios para Devices/Dispositivos
export const devicesService = {
  // Obtener todos los dispositivos con paginación
  getAll: async (params?: { limit?: number; page?: number }) => {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const url = `/devices${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await api.get(url);
    return response.data;
  },

  // Obtener un dispositivo por ID
  getById: async (id: string) => {
    const response = await api.get(`/devices/${id}`);
    return response.data;
  },

  // Obtener dispositivos de un cliente específico
  getByCustomerId: async (customerId: string) => {
    const response = await api.get(`/devices/customer/${customerId}`);
    return response.data;
  },

  // Crear un nuevo dispositivo para un cliente
  createForCustomer: async (data: any) => {
    const response = await api.post('/devices/customer', data);
    return response.data;
  },

  // Actualizar un dispositivo
  // TODO: Implementar cuando el endpoint esté disponible
  update: async (id: string, data: any) => {
    const response = await api.patch(`/devices/${id}`, data);
    return response.data;
  },

  // Inactivar/Eliminar un dispositivo (soft delete)
  delete: async (id: string) => {
    const response = await api.delete(`/devices/${id}`);
    return response.data;
  },

  // Activar un dispositivo
  activate: async (id: string) => {
    const response = await api.patch(`/devices/${id}/activate`);
    return response.data;
  },
};

// ==================== SERVICE ORDERS ====================
export const serviceOrdersService = {
  // Obtener todas las órdenes con filtros y paginación
  getAll: async (params?: {
    status?: string;
    customerId?: string;
    technicianId?: string;
    paymentStatus?: string;
    isDelivered?: boolean;
    search?: string;
    limit?: number;
    page?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.customerId) queryParams.append('customerId', params.customerId);
    if (params?.technicianId)
      queryParams.append('technicianId', params.technicianId);
    if (params?.paymentStatus)
      queryParams.append('paymentStatus', params.paymentStatus);
    if (params?.isDelivered !== undefined)
      queryParams.append('isDelivered', params.isDelivered.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const url = `/service-orders${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await api.get(url);
    return response.data;
  },

  // Obtener una orden por ID
  getById: async (id: string) => {
    const response = await api.get(`/service-orders/${id}`);
    return response.data;
  },

  // Obtener una orden por número
  getByOrderNumber: async (orderNumber: string) => {
    const response = await api.get(
      `/service-orders/order-number/${orderNumber}`
    );
    return response.data;
  },

  // Crear nueva orden
  create: async (data: any) => {
    const response = await api.post('/service-orders', data);
    return response.data;
  },

  // Actualizar orden
  update: async (id: string, data: any) => {
    const response = await api.patch(`/service-orders/${id}`, data);
    return response.data;
  },

  // Cambiar estado de orden
  changeStatus: async (id: string, newStatus: string, notes?: string) => {
    const url = `/service-orders/${id}/status/${newStatus}${
      notes ? `?notes=${encodeURIComponent(notes)}` : ''
    }`;
    const response = await api.patch(url);
    return response.data;
  },
};

// ==================== SERVICE ORDER PHOTOS ====================
import {
  ServiceOrderPhoto,
  ServiceOrderPhotosResponse,
  PhotoCategory,
} from '@/types/service-order-photo';

export const serviceOrderPhotosService = {
  // Obtener todas las fotos de una orden (agrupadas antes/después)
  getPhotos: async (
    serviceOrderId: string
  ): Promise<ServiceOrderPhotosResponse> => {
    const response = await api.get(`/service-orders/${serviceOrderId}/photos`);
    return response.data;
  },

  // Subir una foto
  uploadPhoto: async (
    serviceOrderId: string,
    file: File,
    category: PhotoCategory,
    caption?: string
  ): Promise<ServiceOrderPhoto> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (caption) {
      formData.append('caption', caption);
    }

    const response = await api.post(
      `/service-orders/${serviceOrderId}/photos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Subir múltiples fotos
  uploadMultiplePhotos: async (
    serviceOrderId: string,
    files: File[],
    category: PhotoCategory,
    caption?: string
  ): Promise<ServiceOrderPhoto[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('category', category);
    if (caption) {
      formData.append('caption', caption);
    }

    const response = await api.post(
      `/service-orders/${serviceOrderId}/photos/batch`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Eliminar una foto
  deletePhoto: async (
    serviceOrderId: string,
    photoId: string
  ): Promise<void> => {
    await api.delete(`/service-orders/${serviceOrderId}/photos/${photoId}`);
  },

  // Construir URL completa de la foto
  getPhotoUrl: (url: string): string => {
    return `${API_BASE_URL}${url}`;
  },
};

// ==================== USERS ====================
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  PaginatedUsers,
  UserFilters,
} from '@/types/user';

export const usersService = {
  /**
   * Obtiene todos los usuarios con paginación
   */
  getAll: async (filters?: UserFilters): Promise<PaginatedUsers> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.role) params.append('role', filters.role);
    if (filters?.withDeleted !== undefined)
      params.append('withDeleted', filters.withDeleted.toString());

    const response = await api.get(`/users?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtiene un usuario por ID
   */
  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo usuario
   */
  create: async (data: CreateUserDto): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  /**
   * Actualiza un usuario existente
   */
  update: async (id: string, data: UpdateUserDto): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Elimina un usuario (soft delete)
   */
  delete: async (id: string): Promise<User> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  /**
   * Obtener técnicos activos
   */
  getTechnicians: async () => {
    const response = await api.get('/users/technicians');
    return response.data;
  },
};

// ==================== SERVICE ORDER ITEMS ====================
export const serviceOrderItemsService = {
  // Obtener items de una orden
  getOrderItems: async (orderId: string) => {
    const response = await api.get(`/service-orders/${orderId}/items`);
    return response.data;
  },

  // Agregar item a una orden
  addItem: async (orderId: string, data: any) => {
    const response = await api.post(`/service-orders/${orderId}/items`, data);
    return response.data;
  },

  // Eliminar item de una orden
  removeItem: async (orderId: string, itemId: string) => {
    const response = await api.delete(
      `/service-orders/${orderId}/items/${itemId}`
    );
    return response.data;
  },

  // Actualizar item de una orden
  updateItem: async (orderId: string, itemId: string, data: any) => {
    const response = await api.put(
      `/service-orders/${orderId}/items/${itemId}`,
      data
    );
    return response.data;
  },
};

// ============================================
// Payment Service
// ============================================
import { Payment, CreatePaymentDto, PaymentResponse } from '@/types/payment';

export const paymentsService = {
  /**
   * Obtiene todos los pagos de una orden de servicio
   */
  getPayments: async (serviceOrderId: string): Promise<Payment[]> => {
    const response = await api.get(
      `/service-orders/${serviceOrderId}/payments`
    );
    return response.data;
  },

  /**
   * Crea un nuevo pago para una orden de servicio
   */
  addPayment: async (
    serviceOrderId: string,
    data: CreatePaymentDto
  ): Promise<PaymentResponse> => {
    const response = await api.post(
      `/service-orders/${serviceOrderId}/payments`,
      data
    );
    return response.data;
  },

  /**
   * Elimina un pago de una orden de servicio
   */
  removePayment: async (
    serviceOrderId: string,
    paymentId: string
  ): Promise<PaymentResponse> => {
    const response = await api.delete(
      `/service-orders/${serviceOrderId}/payments/${paymentId}`
    );
    return response.data;
  },
};

// ============================================
// Tasks Service
// ============================================
import {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilters,
  PaginatedTasks,
} from '@/types/task';

export const tasksService = {
  /**
   * Obtiene todas las tareas con filtros y paginación
   */
  getAll: async (filters?: TaskFilters): Promise<PaginatedTasks> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.customer) params.append('customer', filters.customer);
    if (filters?.description) params.append('description', filters.description);
    if (filters?.isDone !== undefined)
      params.append('isDone', filters.isDone.toString());
    if (filters?.hasInvoice !== undefined)
      params.append('hasInvoice', filters.hasInvoice.toString());

    const url = `/tasks?${params.toString()}`;
    console.log('🔍 URL de búsqueda de tareas:', url);
    console.log('📊 Filtros enviados:', filters);

    const response = await api.get(url);
    return response.data;
  },

  /**
   * Obtiene una tarea por ID
   */
  getById: async (id: string): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  /**
   * Crea una nueva tarea
   */
  create: async (data: CreateTaskDto): Promise<Task> => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  /**
   * Actualiza una tarea existente
   */
  update: async (id: string, data: UpdateTaskDto): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}`, data);
    return response.data;
  },

  /**
   * Elimina una tarea
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  /**
   * Elimina un item de una tarea
   */
  deleteItem: async (taskId: string, itemId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}/items/${itemId}`);
  },
};

// ============================================
// PDF Service
// ============================================

export const pdfService = {
  /**
   * Previsualiza el PDF de una orden de servicio en una nueva pestaña
   */
  previewPDF: async (orderId: string): Promise<void> => {
    const response = await fetchWithSession(
      'staff',
      `/service-orders/${orderId}/pdf/preview`
    );

    if (!response.ok) {
      throw new Error('Error al generar la vista previa del PDF');
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  },

  /**
   * Descarga el PDF de una orden de servicio
   */
  downloadPDF: async (orderId: string, orderNumber: string): Promise<void> => {
    const response = await fetchWithSession(
      'staff',
      `/service-orders/${orderId}/pdf`
    );

    if (!response.ok) {
      throw new Error('Error al descargar el PDF');
    }

    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orden-servicio-${orderNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },
};

// ============================================
// Customer Portal Service
// ============================================

/**
 * Instancia de axios para el portal de clientes (usa customerToken)
 */
const portalApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor para agregar el token del cliente
portalApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('customerToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación del portal: renueva la
// sesión y, si ya no existe, manda al login del portal
portalApi.interceptors.response.use(
  (response) => response,
  retryAfterRefresh(
    portalApi,
    'customer',
    [
      '/customer-auth/login',
      '/customer-auth/change-password',
      '/customer-auth/refresh',
      '/customer-auth/logout',
    ],
    () => {
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerName');
      localStorage.removeItem('mustChangePassword');
      window.location.href = '/portal/login';
    }
  )
);

export const customerAuthService = {
  login: async (documentNumber: string, password: string) => {
    const response = await portalApi.post('/customer-auth/login', {
      documentNumber,
      password,
    });
    if (response.data.accessToken) {
      localStorage.setItem('customerToken', response.data.accessToken);
      localStorage.setItem('customerName', response.data.name);
      if (response.data.mustChangePassword) {
        localStorage.setItem('mustChangePassword', 'true');
      } else {
        localStorage.removeItem('mustChangePassword');
      }
    }
    return response.data;
  },

  logout: async () => {
    try {
      await portalApi.post('/customer-auth/logout');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerName');
      localStorage.removeItem('mustChangePassword');
      window.location.href = '/portal/login';
    }
  },

  validate: async () => {
    const check = async () => {
      try {
        const response = await portalApi.get('/customer-auth/validate');
        return response.data;
      } catch {
        return { valid: false };
      }
    };

    const validation = await check();
    if (validation.valid) return validation;

    // El access token venció o no está: se intenta con el refresh token
    const result = await refreshSession('customer');
    return result.status === 'ok' ? check() : validation;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await portalApi.post('/customer-auth/change-password', {
      currentPassword,
      newPassword,
    });
    if (response.data.accessToken) {
      localStorage.setItem('customerToken', response.data.accessToken);
      localStorage.setItem('customerName', response.data.name);
      localStorage.removeItem('mustChangePassword');
    }
    return response.data;
  },
};

export const customerPortalService = {
  getProfile: async () => {
    const response = await portalApi.get('/customer-portal/profile');
    return response.data;
  },

  getDevicesWithOrders: async () => {
    const response = await portalApi.get('/customer-portal/devices');
    return response.data;
  },

  previewOrderPdf: async (orderId: string): Promise<void> => {
    const response = await fetchWithSession(
      'customer',
      `/customer-portal/orders/${orderId}/pdf/preview`
    );

    if (!response.ok) {
      throw new Error('Error al generar la vista previa del PDF');
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  },

  downloadOrderPdf: async (
    orderId: string,
    orderNumber: string
  ): Promise<void> => {
    const response = await fetchWithSession(
      'customer',
      `/customer-portal/orders/${orderId}/pdf`
    );

    if (!response.ok) {
      throw new Error('Error al descargar el PDF');
    }

    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orden-servicio-${orderNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },
};

export default api;
