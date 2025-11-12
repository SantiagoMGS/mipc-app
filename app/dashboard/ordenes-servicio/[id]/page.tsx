'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  useServiceOrder,
  useUpdateServiceOrder,
  useChangeServiceOrderStatus,
} from '@/hooks/useServiceOrders';
import { useCustomer } from '@/hooks/useCustomers';
import { useDevice } from '@/hooks/useDevices';
import {
  StatusBadge,
  PriorityBadge,
  PaymentStatusBadge,
} from '@/components/ServiceOrderBadges';
import {
  STATUS_TRANSITIONS,
  STATUS_LABELS,
  ServiceOrderStatus,
} from '@/types/service-order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  User,
  Laptop,
  UserCog,
  Calendar,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye,
  Download,
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ServiceOrderItems } from '@/components/ServiceOrderItems';
import { ServiceOrderCosts } from '@/components/ServiceOrderCosts';
import { PaymentsSection } from '@/components/PaymentsSection';
import { pdfService } from '@/lib/api';

export default function DetalleOrdenServicioPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  // Queries
  const { data: order, isLoading, error, refetch } = useServiceOrder(orderId);
  const { data: customer } = useCustomer(order?.customerId || '');
  const { data: device } = useDevice(order?.deviceId || '');

  // Handler para refrescar la orden después de agregar/eliminar items
  const handleOrderUpdate = () => {
    refetch();
  };

  // Mutations
  const updateOrderMutation = useUpdateServiceOrder();
  const changeStatusMutation = useChangeServiceOrderStatus();

  // Estados del formulario
  const [isEditMode, setIsEditMode] = useState(false);
  const [diagnosticNotes, setDiagnosticNotes] = useState('');
  const [observations, setObservations] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isDelivered, setIsDelivered] = useState(false);
  const [invoice, setInvoice] = useState('');

  // Modal de cambio de estado
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<
    ServiceOrderStatus | ''
  >('');
  const [statusNotes, setStatusNotes] = useState('');

  // Estados para PDF
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Sincronizar con datos de la orden
  useEffect(() => {
    if (order) {
      setDiagnosticNotes(order.diagnosis || order.diagnosticNotes || '');
      setObservations(order.observations || '');
      setInternalNotes(order.internalNotes || '');
      setDeliveryNotes(order.deliveryNotes || '');
      setIsDelivered(order.isDelivered || false);
      setInvoice(order.invoice || order.invoiceNumber || '');
    }
  }, [order]);

  const handleSaveChanges = async () => {
    if (!order) return;

    try {
      await updateOrderMutation.mutateAsync({
        id: order.id,
        data: {
          diagnosticNotes: diagnosticNotes.trim() || undefined,
          observations: observations.trim() || undefined,
          internalNotes: internalNotes.trim() || undefined,
          deliveryNotes: deliveryNotes.trim() || undefined,
          isDelivered,
          invoice: invoice.trim() || undefined,
        },
      });
      setIsEditMode(false);
    } catch (error) {
      console.error('Error al actualizar orden:', error);
    }
  };

  const handleCancelEdit = () => {
    if (order) {
      setDiagnosticNotes(order.diagnosis || order.diagnosticNotes || '');
      setObservations(order.observations || '');
      setInternalNotes(order.internalNotes || '');
      setDeliveryNotes(order.deliveryNotes || '');
      setIsDelivered(order.isDelivered || false);
      setInvoice(order.invoice || order.invoiceNumber || '');
    }
    setIsEditMode(false);
  };

  const handleOpenStatusModal = () => {
    setSelectedNewStatus('');
    setStatusNotes('');
    setShowStatusModal(true);
  };

  const handleChangeStatus = async () => {
    if (!order || !selectedNewStatus) return;

    try {
      await changeStatusMutation.mutateAsync({
        id: order.id,
        newStatus: selectedNewStatus,
        notes: statusNotes.trim() || undefined,
      });
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  const getAvailableStatuses = (): ServiceOrderStatus[] => {
    if (!order) return [];
    return STATUS_TRANSITIONS[order.status as ServiceOrderStatus] || [];
  };

  // Manejadores de PDF
  const handlePreviewPDF = async () => {
    if (!order) return;

    setIsGeneratingPDF(true);
    setPdfError(null);

    try {
      await pdfService.previewPDF(order.id);
    } catch (error) {
      console.error('Error al previsualizar PDF:', error);
      setPdfError('Error al generar la vista previa del PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!order) return;

    setIsGeneratingPDF(true);
    setPdfError(null);

    try {
      await pdfService.downloadPDF(order.id, order.orderNumber);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      setPdfError('Error al descargar el PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Determinar si se pueden agregar/eliminar items
  const canEditItems = (): boolean => {
    if (!order) return false;
    const lockedStatuses: ServiceOrderStatus[] = [
      'FACTURADO',
      'CANCELADO',
      'NO_REPARABLE',
      'COMPLETO',
    ];
    return !lockedStatuses.includes(order.status as ServiceOrderStatus);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando orden de servicio...
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 dark:text-red-300">
              Error al cargar la orden de servicio
            </p>
            <button
              onClick={() => router.push('/dashboard/ordenes-servicio')}
              className="mt-3 text-sm text-red-600 dark:text-red-400 underline"
            >
              Volver a órdenes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const availableStatuses = getAvailableStatuses();

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/ordenes-servicio')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
              Orden {order.orderNumber}
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
              Creada el {new Date(order.createdAt).toLocaleDateString('es-CO')}
            </p>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* Botones de PDF */}
          <Button
            onClick={handlePreviewPDF}
            disabled={isGeneratingPDF}
            variant="outline"
            className="gap-2"
            title="Ver PDF"
          >
            <Eye className="w-5 h-5" />
            <span className="hidden md:inline">
              {isGeneratingPDF ? 'Generando...' : 'Ver PDF'}
            </span>
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            variant="outline"
            className="gap-2"
            title="Descargar PDF"
          >
            <Download className="w-5 h-5" />
            <span className="hidden md:inline">
              {isGeneratingPDF ? 'Generando...' : 'Descargar PDF'}
            </span>
          </Button>

          {availableStatuses.length > 0 && (
            <Button
              onClick={handleOpenStatusModal}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="hidden md:inline">Cambiar Estado</span>
            </Button>
          )}
          {!isEditMode ? (
            <Button onClick={() => setIsEditMode(true)} className="gap-2">
              <Edit className="w-5 h-5" />
              <span className="hidden md:inline">Editar</span>
            </Button>
          ) : (
            <>
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                className="gap-2"
              >
                <X className="w-5 h-5" />
                <span className="hidden md:inline">Cancelar</span>
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={updateOrderMutation.isPending}
                className="gap-2"
              >
                <Save className="w-5 h-5" />
                <span className="hidden md:inline">
                  {updateOrderMutation.isPending ? 'Guardando...' : 'Guardar'}
                </span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mensaje de Error de PDF */}
      {pdfError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 dark:text-red-300">{pdfError}</p>
            <button
              onClick={() => setPdfError(null)}
              className="mt-2 text-sm text-red-600 dark:text-red-400 underline"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Estado y Prioridad */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Estado Actual
            </p>
            <StatusBadge status={order.status} />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Prioridad
            </p>
            <PriorityBadge priority={order.priority} />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Estado de Pago
            </p>
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>
      </div>

      {/* Información del Cliente */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary-500" />
          <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white">
            Información del Cliente
          </h2>
        </div>
        {customer ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Nombre</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {customer.customerType === 'JURIDICA' && customer.businessName
                  ? customer.businessName
                  : `${customer.firstName} ${customer.lastName}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Documento
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {customer.documentType}: {customer.documentNumber}
              </p>
            </div>
            {customer.phoneNumber && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Teléfono
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {customer.phoneNumber}
                </p>
              </div>
            )}
            {customer.email && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Email
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {customer.email}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            Cargando información del cliente...
          </p>
        )}
      </div>

      {/* Información del Dispositivo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Laptop className="w-5 h-5 text-primary-500" />
          <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white">
            Dispositivo
          </h2>
        </div>
        {device ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tipo</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {device.deviceType?.name || 'Sin tipo'}
              </p>
            </div>
            {device.brand && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Marca
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {device.brand}
                </p>
              </div>
            )}
            {device.model && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Modelo
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {device.model}
                </p>
              </div>
            )}
            {device.serial && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Serial
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {device.serial}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            Cargando información del dispositivo...
          </p>
        )}
      </div>

      {/* Descripción del Problema */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-primary-500" />
          <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white">
            Descripción del Problema
          </h2>
        </div>
        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {order.reportedIssue || order.problemDescription || 'Sin descripción'}
        </p>
      </div>

      {/* Diagnóstico y Observaciones */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Notas y Observaciones
        </h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="diagnosticNotes">Notas de Diagnóstico</Label>
            {isEditMode ? (
              <textarea
                id="diagnosticNotes"
                value={diagnosticNotes}
                onChange={(e) => setDiagnosticNotes(e.target.value)}
                rows={4}
                className="mt-2 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Ingrese las notas del diagnóstico..."
              />
            ) : (
              <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {diagnosticNotes || 'Sin notas de diagnóstico'}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="internalNotes">Notas Internas</Label>
            {isEditMode ? (
              <textarea
                id="internalNotes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
                className="mt-2 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Notas internas para el equipo técnico..."
              />
            ) : (
              <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {internalNotes || 'Sin notas internas'}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="deliveryNotes">Notas de Entrega</Label>
            {isEditMode ? (
              <textarea
                id="deliveryNotes"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows={3}
                className="mt-2 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Notas para la entrega del equipo..."
              />
            ) : (
              <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {deliveryNotes || 'Sin notas de entrega'}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="observations">Observaciones</Label>
            {isEditMode ? (
              <textarea
                id="observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={3}
                className="mt-2 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Observaciones adicionales..."
              />
            ) : (
              <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {observations || 'Sin observaciones'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoice">Número de Factura</Label>
              {isEditMode ? (
                <Input
                  id="invoice"
                  type="text"
                  value={invoice}
                  onChange={(e) => setInvoice(e.target.value)}
                  className="mt-2"
                  placeholder="Ej: FAC-2025-001"
                />
              ) : (
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  {invoice || 'Sin factura'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <input
                id="isDelivered"
                type="checkbox"
                checked={isDelivered}
                onChange={(e) => setIsDelivered(e.target.checked)}
                disabled={!isEditMode}
                className="w-5 h-5 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 focus:ring-offset-0 dark:focus:ring-offset-gray-800"
              />
              <Label htmlFor="isDelivered" className="cursor-pointer">
                Equipo Entregado
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Items de la Orden */}
      <ServiceOrderItems
        orderId={order.id}
        onOrderUpdate={handleOrderUpdate}
        readOnly={!canEditItems()}
        orderStatus={order.status}
      />

      {/* Gestión de Pagos */}
      <PaymentsSection
        serviceOrderId={order.id}
        orderStatus={order.status}
        totalCost={order.totalCost || 0}
        initialTotalPaid={order.totalPaid || 0}
        initialPaymentStatus={order.paymentStatus}
      />

      {/* Resumen de Costos */}
      <ServiceOrderCosts order={order} />

      {/* Modal de Cambio de Estado */}
      <ConfirmDialog
        isOpen={showStatusModal}
        title="Cambiar Estado de la Orden"
        message={
          <div className="space-y-4">
            <div>
              <Label htmlFor="newStatus">Nuevo Estado</Label>
              <select
                id="newStatus"
                value={selectedNewStatus}
                onChange={(e) =>
                  setSelectedNewStatus(e.target.value as ServiceOrderStatus)
                }
                className="mt-2 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccione un estado</option>
                {availableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="statusNotes">Notas del Cambio (opcional)</Label>
              <textarea
                id="statusNotes"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
                className="mt-2 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Ej: Cliente aprobó presupuesto"
              />
            </div>
          </div>
        }
        confirmText="Cambiar Estado"
        cancelText="Cancelar"
        onConfirm={handleChangeStatus}
        onCancel={() => setShowStatusModal(false)}
        type="warning"
        isConfirmDisabled={!selectedNewStatus || changeStatusMutation.isPending}
      />
    </div>
  );
}
