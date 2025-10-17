'use client';

import { LayoutGrid, List } from 'lucide-react';
import { useViewMode } from '@/contexts/ViewModeContext';
import { Button } from '@/components/ui/button';

export function ViewModeToggle() {
  const { viewMode, toggleViewMode } = useViewMode();

  return (
    <Button
      onClick={toggleViewMode}
      variant="outline"
      size="icon"
      title={viewMode === 'table' ? 'Ver como tarjetas' : 'Ver como tabla'}
      className="flex-shrink-0"
    >
      {viewMode === 'table' ? (
        <LayoutGrid className="w-5 h-5" />
      ) : (
        <List className="w-5 h-5" />
      )}
    </Button>
  );
}
