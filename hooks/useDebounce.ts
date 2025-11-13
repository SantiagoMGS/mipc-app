import { useEffect, useState } from 'react';

/**
 * Hook para debounce de valores
 * @param value - Valor a hacer debounce
 * @param delay - Tiempo de espera en milisegundos (default: 500ms)
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
