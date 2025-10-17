import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsService } from '@/lib/api';
import { CreatePaymentDto, Payment, PaymentResponse } from '@/types/payment';
import { useToast } from './use-toast';
import { serviceOrderKeys } from './useServiceOrders';

export function usePayments(serviceOrderId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obtener los pagos
  const {
    data: payments = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Payment[]>({
    queryKey: ['payments', serviceOrderId],
    queryFn: () => paymentsService.getPayments(serviceOrderId),
    enabled: !!serviceOrderId,
  });

  // Mutation para agregar un pago
  const addPaymentMutation = useMutation<
    PaymentResponse,
    Error,
    CreatePaymentDto
  >({
    mutationFn: (data: CreatePaymentDto) =>
      paymentsService.addPayment(serviceOrderId, data),
    onSuccess: (response) => {
      // Actualizar la cache de pagos
      queryClient.invalidateQueries({ queryKey: ['payments', serviceOrderId] });
      
      // Actualizar la orden de servicio específica
      queryClient.invalidateQueries({
        queryKey: serviceOrderKeys.detail(serviceOrderId),
      });
      
      // Actualizar todas las listas de órdenes de servicio
      queryClient.invalidateQueries({
        queryKey: serviceOrderKeys.lists(),
      });

      toast({
        title: 'Pago registrado',
        description: `Se agregó un pago de $${response.payment.amount.toLocaleString(
          'es-CO'
        )}`,
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al agregar el pago';

      // Mapear errores del backend a mensajes amigables
      let friendlyMessage = errorMessage;
      if (errorMessage.includes('must be greater than 0')) {
        friendlyMessage = 'El monto debe ser mayor a 0';
      } else if (errorMessage.includes('exceeds current balance')) {
        friendlyMessage = 'El monto excede el saldo pendiente';
      } else if (errorMessage.includes('Cannot add payments')) {
        friendlyMessage =
          'No se pueden agregar pagos a órdenes canceladas o no reparables';
      } else if (errorMessage.includes('not found')) {
        friendlyMessage = 'Orden no encontrada';
      }

      toast({
        title: 'Error',
        description: friendlyMessage,
        variant: 'destructive',
      });
    },
  });

  // Mutation para eliminar un pago
  const removePaymentMutation = useMutation<PaymentResponse, Error, string>({
    mutationFn: (paymentId: string) =>
      paymentsService.removePayment(serviceOrderId, paymentId),
    onSuccess: (response) => {
      // Actualizar la cache de pagos
      queryClient.invalidateQueries({ queryKey: ['payments', serviceOrderId] });
      
      // Actualizar la orden de servicio específica
      queryClient.invalidateQueries({
        queryKey: serviceOrderKeys.detail(serviceOrderId),
      });
      
      // Actualizar todas las listas de órdenes de servicio
      queryClient.invalidateQueries({
        queryKey: serviceOrderKeys.lists(),
      });

      toast({
        title: 'Pago eliminado',
        description: 'El pago se eliminó correctamente',
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al eliminar el pago';

      let friendlyMessage = errorMessage;
      if (errorMessage.includes('not found')) {
        friendlyMessage = 'Pago no encontrado';
      }

      toast({
        title: 'Error',
        description: friendlyMessage,
        variant: 'destructive',
      });
    },
  });

  return {
    payments,
    isLoading,
    error,
    refetch,
    addPayment: addPaymentMutation.mutateAsync,
    removePayment: removePaymentMutation.mutateAsync,
    isAddingPayment: addPaymentMutation.isPending,
    isRemovingPayment: removePaymentMutation.isPending,
  };
}
