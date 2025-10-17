'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, RefreshCw } from 'lucide-react';
import { AnalyticsParams } from '@/lib/analytics';

interface DateFilterProps {
  onFilterChange: (params: AnalyticsParams) => void;
  showGroupBy?: boolean;
}

export function DateFilter({
  onFilterChange,
  showGroupBy = false,
}: DateFilterProps) {
  const [range, setRange] = useState<
    'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM'
  >('MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [compare, setCompare] = useState(false);
  const [groupBy, setGroupBy] = useState<'DAY' | 'WEEK' | 'MONTH' | 'YEAR'>(
    'MONTH'
  );

  const handleApply = () => {
    const params: AnalyticsParams = {
      range,
      compare,
    };

    if (range === 'CUSTOM') {
      params.startDate = startDate;
      params.endDate = endDate;
    }

    if (showGroupBy) {
      params.groupBy = groupBy;
    }

    onFilterChange(params);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-wrap items-end gap-4">
        {/* Rango de fecha */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="range" className="mb-2 block">
            Período
          </Label>
          <select
            id="range"
            value={range}
            onChange={(e) => setRange(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="TODAY">Hoy</option>
            <option value="WEEK">Esta Semana</option>
            <option value="MONTH">Este Mes</option>
            <option value="YEAR">Este Año</option>
            <option value="CUSTOM">Personalizado</option>
          </select>
        </div>

        {/* Fechas personalizadas */}
        {range === 'CUSTOM' && (
          <>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="startDate" className="mb-2 block">
                Fecha Inicio
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="endDate" className="mb-2 block">
                Fecha Fin
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </>
        )}

        {/* Agrupar por (solo para revenue summary) */}
        {showGroupBy && (
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="groupBy" className="mb-2 block">
              Agrupar Por
            </Label>
            <select
              id="groupBy"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="DAY">Día</option>
              <option value="WEEK">Semana</option>
              <option value="MONTH">Mes</option>
              <option value="YEAR">Año</option>
            </select>
          </div>
        )}

        {/* Comparar */}
        <div className="flex items-center gap-2">
          <input
            id="compare"
            type="checkbox"
            checked={compare}
            onChange={(e) => setCompare(e.target.checked)}
            className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
          />
          <Label htmlFor="compare" className="cursor-pointer">
            Comparar período anterior
          </Label>
        </div>

        {/* Botón aplicar */}
        <Button onClick={handleApply} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
}
