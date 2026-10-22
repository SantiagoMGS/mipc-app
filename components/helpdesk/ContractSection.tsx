'use client';

import { useState } from 'react';
import { Headset, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentUserRole } from '@/lib/auth-utils';
import { formatBogotaDate, formatMinutes } from '@/lib/format';
import {
  currentTerms,
  formatSchedule,
  formatTarget,
  upcomingTerms,
} from '@/lib/helpdesk-format';
import {
  useCreateContract,
  useCustomerContract,
  useUpdateContract,
} from '@/hooks/useHelpdeskContracts';
import {
  ContractPriorityInput,
  HelpdeskContract,
  PRIORITY_LABELS,
  TargetUnit,
} from '@/types/helpdesk';

const WEEK_DAYS = [
  { value: 1, short: 'L', name: 'Lunes' },
  { value: 2, short: 'M', name: 'Martes' },
  { value: 3, short: 'X', name: 'Miércoles' },
  { value: 4, short: 'J', name: 'Jueves' },
  { value: 5, short: 'V', name: 'Viernes' },
  { value: 6, short: 'S', name: 'Sábado' },
  { value: 7, short: 'D', name: 'Domingo' },
];

interface FormState {
  monthlyHours: string;
  startDate: string;
  endDate: string;
  workDays: number[];
  workStart: string;
  workEnd: string;
  isActive: boolean;
  priorities: ContractPriorityInput[];
}

function initialForm(contract: HelpdeskContract | null): FormState {
  if (!contract) {
    return {
      monthlyHours: '18',
      startDate: '',
      endDate: '',
      workDays: [1, 2, 3, 4, 5],
      workStart: '07:00',
      workEnd: '17:00',
      isActive: true,
      priorities: [],
    };
  }
  const terms = upcomingTerms(contract) ?? currentTerms(contract);
  return {
    monthlyHours: String((terms?.monthlyMinutes ?? 0) / 60),
    startDate: contract.startDate.slice(0, 10),
    endDate: contract.endDate
      ? new Date(contract.endDate).toISOString().slice(0, 10)
      : '',
    workDays: contract.workDays,
    workStart: contract.workStart,
    workEnd: contract.workEnd,
    isActive: contract.isActive,
    priorities: contract.priorities.map(
      ({ level, criterion, targetAmount, targetUnit }) => ({
        level,
        criterion,
        targetAmount,
        targetUnit,
      })
    ),
  };
}

/** Contrato de mesa de ayuda del cliente. Crear y editar es solo para ADMIN. */
export default function ContractSection({
  customerId,
}: {
  customerId: string;
}) {
  const { data: contract, isLoading } = useCustomerContract(customerId);
  const createContract = useCreateContract(customerId);
  const updateContract = useUpdateContract(customerId);
  const isAdmin = getCurrentUserRole() === 'ADMIN';
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm(null));

  const startEditing = () => {
    setForm(initialForm(contract ?? null));
    setEditing(true);
  };

  const toggleDay = (day: number) =>
    setForm((f) => ({
      ...f,
      workDays: f.workDays.includes(day)
        ? f.workDays.filter((d) => d !== day)
        : [...f.workDays, day],
    }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const schedule = {
      workDays: form.workDays,
      workStart: form.workStart,
      workEnd: form.workEnd,
    };
    if (contract) {
      await updateContract.mutateAsync({
        id: contract.id,
        data: {
          ...schedule,
          monthlyHours: Number(form.monthlyHours),
          endDate: form.endDate || null,
          isActive: form.isActive,
          priorities: form.priorities,
        },
      });
    } else {
      await createContract.mutateAsync({
        ...schedule,
        customerId,
        monthlyHours: Number(form.monthlyHours),
        startDate: form.startDate,
        endDate: form.endDate || undefined,
      });
    }
    setEditing(false);
  };

  const saving = createContract.isPending || updateContract.isPending;

  return (
    <section
      aria-labelledby="helpdesk-contract-title"
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2
          id="helpdesk-contract-title"
          className="flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-white"
        >
          <Headset className="w-6 h-6 text-primary-500" />
          Mesa de ayuda
        </h2>
        {contract && isAdmin && !editing && (
          <Button
            variant="outline"
            size="sm"
            onClick={startEditing}
            className="gap-1"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : editing ? (
        <form onSubmit={save} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="contract-hours">Horas al mes</Label>
              <Input
                id="contract-hours"
                type="number"
                min="0.25"
                step="0.25"
                required
                value={form.monthlyHours}
                onChange={(e) =>
                  setForm({ ...form, monthlyHours: e.target.value })
                }
              />
              {contract && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Un cambio de horas aplica desde el mes siguiente.
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="contract-start">Fecha de inicio</Label>
              <Input
                id="contract-start"
                type="date"
                required
                disabled={!!contract}
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contract-end">Fecha de fin (opcional)</Label>
              <Input
                id="contract-end"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Horario hábil
            </legend>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map((day) => {
                const selected = form.workDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    aria-pressed={selected}
                    aria-label={day.name}
                    title={day.name}
                    onClick={() => toggleDay(day.value)}
                    className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                      selected
                        ? 'bg-primary text-primary-foreground border-transparent'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-xs">
              <div className="space-y-1">
                <Label htmlFor="contract-work-start">Desde</Label>
                <Input
                  id="contract-work-start"
                  type="time"
                  required
                  value={form.workStart}
                  onChange={(e) =>
                    setForm({ ...form, workStart: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contract-work-end">Hasta</Label>
                <Input
                  id="contract-work-end"
                  type="time"
                  required
                  value={form.workEnd}
                  onChange={(e) =>
                    setForm({ ...form, workEnd: e.target.value })
                  }
                />
              </div>
            </div>
          </fieldset>

          {contract && (
            <>
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tiempos de respuesta
                </legend>
                {form.priorities.map((priority, index) => (
                  <div
                    key={priority.level}
                    className="grid grid-cols-1 sm:grid-cols-[7rem_1fr_5rem_8rem] gap-2 items-center"
                  >
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {PRIORITY_LABELS[priority.level]}
                    </span>
                    <Input
                      aria-label={`Criterio ${PRIORITY_LABELS[priority.level]}`}
                      value={priority.criterion ?? ''}
                      onChange={(e) => {
                        const priorities = [...form.priorities];
                        priorities[index] = {
                          ...priority,
                          criterion: e.target.value,
                        };
                        setForm({ ...form, priorities });
                      }}
                    />
                    <Input
                      aria-label={`Tiempo ${PRIORITY_LABELS[priority.level]}`}
                      type="number"
                      min="1"
                      value={priority.targetAmount ?? 1}
                      onChange={(e) => {
                        const priorities = [...form.priorities];
                        priorities[index] = {
                          ...priority,
                          targetAmount: Number(e.target.value),
                        };
                        setForm({ ...form, priorities });
                      }}
                    />
                    <select
                      aria-label={`Unidad ${PRIORITY_LABELS[priority.level]}`}
                      value={priority.targetUnit}
                      onChange={(e) => {
                        const priorities = [...form.priorities];
                        priorities[index] = {
                          ...priority,
                          targetUnit: e.target.value as TargetUnit,
                        };
                        setForm({ ...form, priorities });
                      }}
                      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm dark:bg-gray-800 dark:text-white"
                    >
                      <option value="HOURS">horas hábiles</option>
                      <option value="DAYS">días hábiles</option>
                    </select>
                  </div>
                ))}
              </fieldset>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                Contrato activo
              </label>
            </>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || form.workDays.length === 0}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar contrato
            </Button>
          </div>
        </form>
      ) : !contract ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Este cliente no tiene contrato de mesa de ayuda.
          </p>
          {isAdmin && <Button onClick={startEditing}>Crear contrato</Button>}
        </div>
      ) : (
        <ContractSummary contract={contract} />
      )}
    </section>
  );
}

function ContractSummary({ contract }: { contract: HelpdeskContract }) {
  const terms = currentTerms(contract);
  const upcoming = upcomingTerms(contract);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatMinutes(terms?.monthlyMinutes ?? 0)} al mes
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            contract.isActive
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {contract.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
        <p>
          Desde {formatBogotaDate(contract.startDate)}
          {contract.endDate && ` hasta ${formatBogotaDate(contract.endDate)}`}
        </p>
        <p>
          {formatSchedule(
            contract.workDays,
            contract.workStart,
            contract.workEnd
          )}
        </p>
        {upcoming && (
          <p className="text-primary-700 dark:text-primary-400">
            Desde {upcoming.effectiveFrom}:{' '}
            {formatMinutes(upcoming.monthlyMinutes)} al mes
          </p>
        )}
      </div>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700 border-t border-gray-200 dark:border-gray-700">
        {contract.priorities.map((priority) => (
          <li
            key={priority.level}
            className="py-2 grid grid-cols-1 sm:grid-cols-[6rem_1fr_auto] gap-x-4 gap-y-0.5 text-sm"
          >
            <span className="font-semibold text-gray-800 dark:text-white">
              {PRIORITY_LABELS[priority.level]}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {priority.criterion}
            </span>
            <span className="text-gray-800 dark:text-gray-200 sm:text-right">
              {formatTarget(priority.targetAmount, priority.targetUnit)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
