import api from './api';

export interface AnalyticsParams {
  range?: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
  compare?: boolean;
  groupBy?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
}

// Función helper para construir query params
export function buildAnalyticsParams(params: AnalyticsParams): string {
  const searchParams = new URLSearchParams();

  if (params.range) searchParams.append('range', params.range);
  if (params.startDate) searchParams.append('startDate', params.startDate);
  if (params.endDate) searchParams.append('endDate', params.endDate);
  if (params.compare !== undefined)
    searchParams.append('compare', params.compare.toString());
  if (params.groupBy) searchParams.append('groupBy', params.groupBy);

  return searchParams.toString();
}

// Servicios de Analytics
export const analyticsService = {
  // 1. Órdenes por estado
  async getOrdersByStatus(params: AnalyticsParams) {
    const query = buildAnalyticsParams(params);
    const response = await api.get(`/analytics/orders/by-status?${query}`);
    return response.data;
  },

  // 2. Tendencia de órdenes
  async getOrdersTrend(params: AnalyticsParams) {
    const query = buildAnalyticsParams(params);
    const response = await api.get(`/analytics/orders/trend?${query}`);
    return response.data;
  },

  // 3. Tiempo promedio
  async getAverageTime(params: AnalyticsParams) {
    const query = buildAnalyticsParams(params);
    const response = await api.get(`/analytics/orders/average-time?${query}`);
    return response.data;
  },

  // 4. Resumen de ingresos
  async getRevenueSummary(params: AnalyticsParams) {
    const query = buildAnalyticsParams(params);
    const response = await api.get(`/analytics/revenue/summary?${query}`);
    return response.data;
  },

  // 5. Ingresos por estado de pago
  async getRevenueByPaymentStatus(params: AnalyticsParams) {
    const query = buildAnalyticsParams(params);
    const response = await api.get(
      `/analytics/revenue/by-payment-status?${query}`
    );
    return response.data;
  },

  // 6. Saldo pendiente
  async getPendingBalance(params: AnalyticsParams) {
    const query = buildAnalyticsParams(params);
    const response = await api.get(
      `/analytics/revenue/pending-balance?${query}`
    );
    return response.data;
  },

  // 7. Ingresos por tipo de item
  async getRevenueByItemType(params: AnalyticsParams) {
    const query = buildAnalyticsParams(params);
    const response = await api.get(`/analytics/revenue/by-item-type?${query}`);
    return response.data;
  },

  // 8. Rendimiento de técnicos
  async getTechniciansPerformance(params: AnalyticsParams) {
    const query = buildAnalyticsParams(params);
    const response = await api.get(
      `/analytics/technicians/performance?${query}`
    );
    return response.data;
  },

  // 9. Top clientes
  async getTopCustomers(params: AnalyticsParams) {
    const query = buildAnalyticsParams(params);
    const response = await api.get(`/analytics/customers/top?${query}`);
    return response.data;
  },

  // 10. Tendencia de nuevos clientes
  async getNewCustomersTrend(params: AnalyticsParams) {
    const query = buildAnalyticsParams(params);
    const response = await api.get(`/analytics/customers/new-trend?${query}`);
    return response.data;
  },

  // 11. Clientes por tipo
  async getCustomersByType(params: AnalyticsParams) {
    const query = buildAnalyticsParams(params);
    const response = await api.get(`/analytics/customers/by-type?${query}`);
    return response.data;
  },
};

// Funciones helper de formato
export const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString('es-CO')}`;
};

export const formatCurrencyShort = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value}`;
};

export const formatPercent = (value: number | null): string => {
  if (value === null) return 'N/A';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

export const getChangeColor = (value: number | null): string => {
  if (value === null) return 'text-gray-600 dark:text-gray-400';
  return value > 0
    ? 'text-green-600 dark:text-green-400'
    : value < 0
    ? 'text-red-600 dark:text-red-400'
    : 'text-gray-600 dark:text-gray-400';
};

export const getChangeIcon = (value: number | null): string => {
  if (value === null) return '→';
  return value > 0 ? '↑' : value < 0 ? '↓' : '→';
};
