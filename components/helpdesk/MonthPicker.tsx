'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMonth, shiftMonth } from '@/lib/format';

interface MonthPickerProps {
  value: string; // AAAA-MM
  onChange: (month: string) => void;
  /** Último mes que se puede escoger (normalmente el actual) */
  max: string;
}

export default function MonthPicker({
  value,
  onChange,
  max,
}: MonthPickerProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Mes anterior"
        onClick={() => onChange(shiftMonth(value, -1))}
      >
        <ChevronLeft />
      </Button>
      <p
        className="min-w-[11rem] text-center font-semibold text-gray-900 dark:text-white"
        aria-live="polite"
      >
        {formatMonth(value)}
      </p>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Mes siguiente"
        disabled={value >= max}
        onClick={() => onChange(shiftMonth(value, 1))}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
