'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  analyticsService,
  formatCurrency,
  formatCurrencyShort,
  formatPercent,
  getChangeColor,
  getChangeIcon,
  AnalyticsParams,
} from '@/lib/analytics';
import { DollarSign, TrendingDown, Package } from 'lucide-react';

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
];

interface RevenueSectionProps {
  params: AnalyticsParams;
}

export function RevenueSection({ params }: RevenueSectionProps) {
  const [summary, setSummary] = useState<any>(null);
  const [byPaymentStatus, setByPaymentStatus] = useState<any>(null);
  const [pendingBalance, setPendingBalance] = useState<number>(0);
  const [byItemType, setByItemType] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [summaryData, paymentData, balanceData, itemTypeData] =
          await Promise.all([
            analyticsService.getRevenueSummary({
              ...params,
              groupBy: 'MONTH',
              compare: true,
            }),
            analyticsService.getRevenueByPaymentStatus(params),
            analyticsService.getPendingBalance(params),
            analyticsService.getRevenueByItemType(params),
          ]);
        setSummary(summaryData);
        setByPaymentStatus(paymentData);
        setPendingBalance(balanceData);
        setByItemType(itemTypeData);
      } catch (error) {
        console.error('Error loading revenue analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [params]);

  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Ingresos
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-[300px] bg-gray-100 dark:bg-gray-800 rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Ingresos
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BarChart - Resumen de Ingresos */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resumen de Ingresos
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total:{' '}
              <span className="font-bold text-primary-600 dark:text-primary-400">
                {formatCurrency(summary?.totalRevenue || 0)}
              </span>
            </p>
            {summary?.percentageChange !== null &&
              summary?.percentageChange !== undefined && (
                <p
                  className={`text-sm font-semibold flex items-center gap-1 ${getChangeColor(
                    summary.percentageChange
                  )}`}
                >
                  <span>{getChangeIcon(summary.percentageChange)}</span>
                  <span>{formatPercent(summary.percentageChange)}</span>
                </p>
              )}
          </div>
          {summary?.data && summary.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary.data}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-700"
                />
                <XAxis dataKey="period" className="text-xs" stroke="#9CA3AF" />
                <YAxis
                  className="text-xs"
                  stroke="#9CA3AF"
                  tickFormatter={(value) => formatCurrencyShort(value)}
                />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  labelFormatter={(label) => `Período: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                  }}
                />
                <Bar
                  dataKey="revenue"
                  name="Ingresos"
                  fill="#3B82F6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </Card>

        {/* PieChart - Ingresos por Estado de Pago */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Por Estado de Pago
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Total:{' '}
            <span className="font-bold text-primary-600 dark:text-primary-400">
              {formatCurrency(byPaymentStatus?.totalRevenue || 0)}
            </span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Pendiente:{' '}
            <span className="font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(byPaymentStatus?.totalPending || 0)}
            </span>
          </p>
          {byPaymentStatus?.data && byPaymentStatus.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={byPaymentStatus.data}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry: any) =>
                    `${entry.label}: ${formatCurrencyShort(entry.value)}`
                  }
                >
                  {byPaymentStatus.data.map((_: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 dark:text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </Card>

        {/* Card - Saldo Pendiente */}
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Saldo Pendiente
                </p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {formatCurrency(pendingBalance || 0)}
                </p>
              </div>
            </div>
          </Card>

          {/* BarChart Horizontal - Ingresos por Tipo */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Por Tipo de Item
            </h3>
            {byItemType && byItemType.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byItemType} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-gray-200 dark:stroke-gray-700"
                  />
                  <XAxis
                    type="number"
                    className="text-xs"
                    stroke="#9CA3AF"
                    tickFormatter={(value) => formatCurrencyShort(value)}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    className="text-xs"
                    stroke="#9CA3AF"
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    labelFormatter={(label) => `Tipo: ${label}`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name="Ingresos"
                    fill="#10B981"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                No hay datos disponibles
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
