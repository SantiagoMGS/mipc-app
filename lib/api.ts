import axios from 'axios';

// URL de la API
export const API_URLS = {
  production: 'https://mipc-api-production.up.railway.app',
  local: 'http://localhost:3050',
};

// URL base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || API_URLS.production;

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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string) => {
    try {
      console.log('🔐 Intentando login en:', api.defaults.baseURL);
      console.log('📝 Datos enviados:', { email, password: '***' });

      const response = await api.post('/auth/login', { email, password });
      console.log('✅ Login exitoso:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      console.error('📍 URL:', api.defaults.baseURL + '/auth/login');

      if (error.response) {
        console.error('📦 Respuesta del servidor:', error.response.data);
        console.error('🔢 Status:', error.response.status);
      }

      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
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
    console.log('🔗 URL de petición:', url);
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
    console.log('🔗 URL de petición:', url);
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
    console.log('🔗 URL de petición:', url);
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
    console.log('🔗 URL de petición:', url);
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

export default api;
