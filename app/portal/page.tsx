'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  customerAuthService,
  customerPortalService,
  API_BASE_URL,
} from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';
import {
  User,
  Building2,
  Laptop,
  Mail,
  Phone,
  CreditCard,
  LogOut,
  ChevronDown,
  ChevronRight,
  FileText,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  DollarSign,
  Cpu,
  HardDrive,
  MemoryStick,
  Eye,
} from 'lucide-react';

// ===== Tipos =====

interface CustomerProfile {
  id: string;
  customerType: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  email?: string;
  phoneNumber: string;
  documentType: string;
  documentNumber: string;
}

interface ServiceOrder {
  id: string;
  orderNumber: string;
  status: string;
  priority: string;
  reportedIssue: string;
  diagnosis?: string;
  solution?: string;
  observations?: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  totalPaid: number;
  balance: number;
  paymentStatus: string;
  isDelivered: boolean;
  receivedDate: string;
  completedDate?: string;
  technicianName: string;
}

interface DeviceWithOrders {
  id: string;
  serial?: string;
  description?: string;
  brand?: string;
  model?: string;
  processor?: string;
  ram?: number;
  storage?: number;
  storageType?: string;
  isActive: boolean;
  deviceTypeName: string;
  serviceOrders: ServiceOrder[];
}

// ===== Helpers =====

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  RECIBIDO: {
    label: 'Recibido',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    icon: <Package className="w-3.5 h-3.5" />,
  },
  EN_DIAGNOSTICO: {
    label: 'En Diagnóstico',
    color:
      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    icon: <Wrench className="w-3.5 h-3.5" />,
  },
  ESPERANDO_REPUESTOS: {
    label: 'Esperando Repuestos',
    color:
      'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  EN_REPARACION: {
    label: 'En Reparación',
    color:
      'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    icon: <Wrench className="w-3.5 h-3.5" />,
  },
  REPARADO: {
    label: 'Reparado',
    color:
      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  COMPLETO: {
    label: 'Completo',
    color:
      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  FACTURADO: {
    label: 'Facturado',
    color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  CANCELADO: {
    label: 'Cancelado',
    color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  NO_REPARABLE: {
    label: 'No Reparable',
    color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> =
  {
    PENDIENTE: {
      label: 'Pendiente',
      color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    },
    ABONO: {
      label: 'Abonado',
      color:
        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    },
    PAGADO: {
      label: 'Pagado',
      color:
        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    },
  };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

// ===== Componente principal =====

export default function PortalPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [devices, setDevices] = useState<DeviceWithOrders[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedDevices, setExpandedDevices] = useState<Set<string>>(
    new Set()
  );
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Verificar autenticación
        const validation = await customerAuthService.validate();
        if (!validation.valid) {
          router.replace('/portal/login');
          return;
        }

        // Cargar perfil y dispositivos en paralelo
        const [profileData, devicesData] = await Promise.all([
          customerPortalService.getProfile(),
          customerPortalService.getDevicesWithOrders(),
        ]);

        setProfile(profileData);
        setDevices(devicesData);
      } catch (err: any) {
        console.error('Error cargando datos:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('customerToken');
          localStorage.removeItem('customerName');
          router.replace('/portal/login');
          return;
        }
        setError('Error al cargar los datos. Intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router]);

  const toggleDevice = (deviceId: string) => {
    setExpandedDevices((prev) => {
      const next = new Set(prev);
      if (next.has(deviceId)) {
        next.delete(deviceId);
      } else {
        next.add(deviceId);
      }
      return next;
    });
  };

  const handleViewPdf = async (order: ServiceOrder) => {
    setLoadingPdf(order.id);
    try {
      await customerPortalService.previewOrderPdf(order.id);
    } catch (err) {
      console.error('Error al abrir PDF:', err);
      alert('Error al generar el PDF. Intenta de nuevo.');
    } finally {
      setLoadingPdf(null);
    }
  };

  const handleLogout = () => {
    document.cookie = 'customerToken=; path=/; max-age=0; SameSite=Strict';
    customerAuthService.logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando tu portal...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md w-full">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-700 dark:text-red-300">
                Error
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm text-red-600 dark:text-red-400 underline"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isNatural = profile.customerType === 'NATURAL';
  const customerName = isNatural
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    : profile.businessName || '';

  const totalOrders = devices.reduce(
    (acc, d) => acc + d.serviceOrders.length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo_mipc_tec.png"
              alt="MIPC Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-white">
                Portal de Clientes
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                MIPC Tecnología
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
              {customerName}
            </span>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Información del cliente */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            {isNatural ? (
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            ) : (
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            )}
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {customerName}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CreditCard className="w-4 h-4 flex-shrink-0" />
              <span>
                {profile.documentType}: {profile.documentNumber}
              </span>
            </div>
            {profile.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>{profile.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{profile.phoneNumber}</span>
            </div>
          </div>

          {/* Resumen */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-600 dark:text-gray-400">
                <strong className="text-gray-800 dark:text-white">
                  {devices.length}
                </strong>{' '}
                {devices.length === 1 ? 'equipo' : 'equipos'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-600 dark:text-gray-400">
                <strong className="text-gray-800 dark:text-white">
                  {totalOrders}
                </strong>{' '}
                {totalOrders === 1
                  ? 'orden de servicio'
                  : 'órdenes de servicio'}
              </span>
            </div>
          </div>
        </div>

        {/* Lista de dispositivos */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Laptop className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Mis Equipos
          </h2>

          {devices.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Laptop className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No tienes equipos registrados
              </p>
            </div>
          ) : (
            devices.map((device) => (
              <div
                key={device.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Cabecera del dispositivo (clickeable) */}
                <button
                  onClick={() => toggleDevice(device.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <Laptop className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {device.brand && device.model
                          ? `${device.brand} ${device.model}`
                          : device.brand || device.model || 'Equipo sin nombre'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                          {device.deviceTypeName}
                        </span>
                        {device.serial && <span>S/N: {device.serial}</span>}
                        {device.processor && (
                          <span className="flex items-center gap-1">
                            <Cpu className="w-3 h-3" />
                            {device.processor}
                          </span>
                        )}
                        {device.ram && (
                          <span className="flex items-center gap-1">
                            <MemoryStick className="w-3 h-3" />
                            {device.ram}GB RAM
                          </span>
                        )}
                        {device.storage && (
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3" />
                            {device.storage}GB {device.storageType || ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                      {device.serviceOrders.length}{' '}
                      {device.serviceOrders.length === 1 ? 'orden' : 'órdenes'}
                    </span>
                    {expandedDevices.has(device.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Órdenes de servicio (expandibles) */}
                {expandedDevices.has(device.id) && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    {device.serviceOrders.length === 0 ? (
                      <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p>No hay órdenes de servicio para este equipo</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {device.serviceOrders.map((order) => {
                          const statusConfig =
                            STATUS_CONFIG[order.status] ||
                            STATUS_CONFIG.RECIBIDO;
                          const paymentConfig =
                            PAYMENT_STATUS_CONFIG[order.paymentStatus] ||
                            PAYMENT_STATUS_CONFIG.PENDIENTE;

                          return (
                            <div
                              key={order.id}
                              className="px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-750/50"
                            >
                              {/* Línea superior: número, estado, fecha */}
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-bold text-sm text-gray-800 dark:text-white">
                                    {order.orderNumber}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${statusConfig.color}`}
                                  >
                                    {statusConfig.icon}
                                    {statusConfig.label}
                                  </span>
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${paymentConfig.color}`}
                                  >
                                    {paymentConfig.label}
                                  </span>
                                  {order.isDelivered && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Entregado
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(order.receivedDate)}
                                </span>
                              </div>

                              {/* Problema reportado */}
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <strong className="text-gray-700 dark:text-gray-300">
                                  Problema:
                                </strong>{' '}
                                {order.reportedIssue}
                              </p>

                              {/* Diagnóstico si existe */}
                              {order.diagnosis && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  <strong className="text-gray-700 dark:text-gray-300">
                                    Diagnóstico:
                                  </strong>{' '}
                                  {order.diagnosis}
                                </p>
                              )}

                              {/* Solución si existe */}
                              {order.solution && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  <strong className="text-gray-700 dark:text-gray-300">
                                    Solución:
                                  </strong>{' '}
                                  {order.solution}
                                </p>
                              )}

                              {/* Línea inferior: costos + PDF */}
                              <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    Total:{' '}
                                    <strong className="text-gray-700 dark:text-gray-300">
                                      {formatCurrency(order.totalCost)}
                                    </strong>
                                  </span>
                                  {order.totalPaid > 0 && (
                                    <span>
                                      Pagado:{' '}
                                      <strong className="text-green-600 dark:text-green-400">
                                        {formatCurrency(order.totalPaid)}
                                      </strong>
                                    </span>
                                  )}
                                  {order.balance > 0 && (
                                    <span>
                                      Saldo:{' '}
                                      <strong className="text-red-600 dark:text-red-400">
                                        {formatCurrency(order.balance)}
                                      </strong>
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Wrench className="w-3.5 h-3.5" />
                                    {order.technicianName}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleViewPdf(order)}
                                  disabled={loadingPdf === order.id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {loadingPdf === order.id ? (
                                    <>
                                      <svg
                                        className="animate-spin h-3.5 w-3.5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        ></circle>
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                      </svg>
                                      Generando...
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3.5 h-3.5" />
                                      Ver PDF
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
        © 2025 MIPC Tecnología. Todos los derechos reservados.
      </footer>
    </div>
  );
}
