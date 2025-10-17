import axios from 'axios';

// URL de la API
export const API_URLS = {
  production: 'https://mipc-api-production.up.railway.app',
  local: 'http://localhost:3050',
};

// URL base de la API - Siempre usar production en Vercel
const API_BASE_URL =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || API_URLS.production
    : API_URLS.production;

const api = axios.create({
  baseURL: 'http://localhost:3050',
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
export const usersService = {
  // Obtener técnicos activos
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

export default api;
