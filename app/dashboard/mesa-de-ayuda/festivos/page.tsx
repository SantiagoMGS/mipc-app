'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  useAddHoliday,
  useHolidays,
  useRemoveHoliday,
} from '@/hooks/useHolidays';
import { getCurrentUserRole } from '@/lib/auth-utils';
import { currentBogotaMonth } from '@/lib/format';
import { Holiday } from '@/types/helpdesk';

/** "lunes 12 de octubre" (la fecha es un día, sin hora) */
function formatHoliday(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('es-CO', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function HolidaysPage() {
  const isAdmin = getCurrentUserRole() === 'ADMIN';
  const [year, setYear] = useState(() =>
    Number(currentBogotaMonth().slice(0, 4))
  );
  const { data: holidays = [], isLoading } = useHolidays(year);
  const addHoliday = useAddHoliday();
  const removeHoliday = useRemoveHoliday();

  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [toRemove, setToRemove] = useState<Holiday | null>(null);

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/dashboard/mesa-de-ayuda"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        Mesa de ayuda
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Festivos
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          No cuentan como horas hábiles para el vencimiento de la respuesta. Se
          cargan solos desde una API pública de festivos de Colombia.
        </p>
      </div>

      {isAdmin && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addHoliday.mutate(
              { date, name: name.trim() },
              {
                onSuccess: () => {
                  setDate('');
                  setName('');
                },
              }
            );
          }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-end"
        >
          <div className="space-y-1">
            <Label htmlFor="holiday-date">Fecha</Label>
            <Input
              id="holiday-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="holiday-name">Nombre</Label>
            <Input
              id="holiday-name"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Por ejemplo: cierre de fin de año"
            />
          </div>
          <Button type="submit" disabled={addHoliday.isPending}>
            {addHoliday.isPending && <Loader2 className="animate-spin" />}
            Agregar festivo
          </Button>
        </form>
      )}

      <section
        aria-labelledby="holidays-year"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md"
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Año anterior"
            onClick={() => setYear(year - 1)}
          >
            <ChevronLeft />
          </Button>
          <h2
            id="holidays-year"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {year}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Año siguiente"
            onClick={() => setYear(year + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : holidays.length === 0 ? (
          <p className="p-6 text-sm text-gray-600 dark:text-gray-400">
            No hay festivos guardados para {year}.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {holidays.map((holiday) => (
              <li
                key={holiday.date}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div className={holiday.isActive ? '' : 'opacity-60'}>
                  <p
                    className={`text-sm font-medium text-gray-900 dark:text-white ${holiday.isActive ? '' : 'line-through'}`}
                  >
                    {holiday.name}
                  </p>
                  <p className="text-xs text-gray-500 first-letter:uppercase dark:text-gray-400">
                    {formatHoliday(holiday.date)} ·{' '}
                    {holiday.source === 'API'
                      ? 'Automático'
                      : 'Agregado a mano'}
                    {!holiday.isActive && ' · Quitado'}
                  </p>
                </div>
                {isAdmin &&
                  (holiday.isActive ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setToRemove(holiday)}
                    >
                      Quitar
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={addHoliday.isPending}
                      onClick={() =>
                        addHoliday.mutate({
                          date: holiday.date,
                          name: holiday.name,
                        })
                      }
                    >
                      Volver a contar
                    </Button>
                  ))}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        isOpen={toRemove !== null}
        title="Quitar festivo"
        message={
          toRemove
            ? `${toRemove.name} (${formatHoliday(toRemove.date)}) volverá a contar como día hábil.`
            : ''
        }
        confirmText="Quitar festivo"
        type="warning"
        isConfirmDisabled={removeHoliday.isPending}
        onConfirm={() =>
          toRemove &&
          removeHoliday.mutate(toRemove.date, {
            onSuccess: () => setToRemove(null),
          })
        }
        onCancel={() => setToRemove(null)}
      />
    </div>
  );
}
