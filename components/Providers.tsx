'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { usePathname } from 'next/navigation';
import { queryClient } from '@/lib/queryClient';

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // El botón flotante tapa el menú inferior del portal en el celular
  const showDevtools =
    process.env.NODE_ENV === 'development' && !pathname?.startsWith('/portal');
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        {/* DevTools solo en desarrollo */}
        {showDevtools && <ReactQueryDevtools initialIsOpen={false} />}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
