import { useQuery } from '@tanstack/react-query';
import { customersService, usersService } from '@/lib/api';

/**
 * Hook para buscar clientes con autocompletado
 */
export function useCustomerSearch(query: string, limit: number = 10) {
  return useQuery({
    queryKey: ['customers', 'search', query, limit],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const response = await customersService.search({ q: query, limit });
      return Array.isArray(response) ? response : [];
    },
    enabled: query.length >= 2,
    staleTime: 30000, // 30 segundos
  });
}

/**
 * Hook para obtener técnicos activos
 */
export function useTechnicians() {
  return useQuery({
    queryKey: ['users', 'technicians'],
    queryFn: () => usersService.getTechnicians(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
