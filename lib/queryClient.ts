import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo de caché por defecto: 5 minutos
      staleTime: 1000 * 60 * 5,
      // Tiempo antes de garbage collection: 10 minutos
      gcTime: 1000 * 60 * 10,
      // Reintentar 1 vez en caso de error
      retry: 1,
      // Refetch cuando la ventana recupera el foco
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Reintentar mutaciones fallidas
      retry: 1,
    },
  },
});
