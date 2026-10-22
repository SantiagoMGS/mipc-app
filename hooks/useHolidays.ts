'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { helpdeskService } from '@/lib/api';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from './use-toast';

const holidayKeys = {
  year: (year: number) => ['helpdesk-holidays', year] as const,
};

export function useHolidays(year: number) {
  return useQuery({
    queryKey: holidayKeys.year(year),
    queryFn: () => helpdeskService.getHolidays(year),
  });
}

export function useAddHoliday() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ date, name }: { date: string; name: string }) =>
      helpdeskService.addHoliday(date, name),
    onSuccess: (holiday) => {
      queryClient.invalidateQueries({
        queryKey: holidayKeys.year(Number(holiday.date.slice(0, 4))),
      });
      toast({ title: 'Festivo agregado' });
    },
    onError: (error: any) => {
      toast({
        title: 'No se pudo agregar el festivo',
        description: apiErrorMessage(error, 'Intenta de nuevo.'),
        variant: 'destructive',
      });
    },
  });
}

export function useRemoveHoliday() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (date: string) => helpdeskService.removeHoliday(date),
    onSuccess: (_, date) => {
      queryClient.invalidateQueries({
        queryKey: holidayKeys.year(Number(date.slice(0, 4))),
      });
      toast({ title: 'Festivo quitado' });
    },
    onError: (error: any) => {
      toast({
        title: 'No se pudo quitar el festivo',
        description: apiErrorMessage(error, 'Intenta de nuevo.'),
        variant: 'destructive',
      });
    },
  });
}
