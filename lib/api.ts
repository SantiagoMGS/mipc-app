import axios from 'axios';

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
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  (config) => {
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

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      // Eliminar cookie del middleware
      document.cookie =
        'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    // Eliminar cookie del middleware
    document.cookie =
      'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    window.location.href = '/login';
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
  }) => {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
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
  // Obtener todos los clientes con paginación
  getAll: async (params?: { limit?: number; page?: number }) => {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

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
// PDF Service
// ============================================

/**
 * Obtiene el token de autenticación desde localStorage
 */
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

export const pdfService = {
  /**
   * Previsualiza el PDF de una orden de servicio en una nueva pestaña
   */
  previewPDF: async (orderId: string): Promise<void> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No se encontró token de autenticación');
    }

    const url = `${API_BASE_URL}/service-orders/${orderId}/pdf/preview`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

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
    const token = getAuthToken();
    if (!token) {
      throw new Error('No se encontró token de autenticación');
    }

    const url = `${API_BASE_URL}/service-orders/${orderId}/pdf`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

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
