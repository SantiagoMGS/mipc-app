'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
import { Users, TrendingUp } from 'lucide-react';

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
];

interface CustomersSectionProps {
  params: AnalyticsParams;
}

export function CustomersSection({ params }: CustomersSectionProps) {
  const [topCustomers, setTopCustomers] = useState<any>(null);
  const [newTrend, setNewTrend] = useState<any>(null);
  const [byType, setByType] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [topData, trendData, typeData] = await Promise.all([
          analyticsService.getTopCustomers(params),
          analyticsService.getNewCustomersTrend({ ...params, compare: true }),
          analyticsService.getCustomersByType(params),
        ]);
        setTopCustomers(topData);
        setNewTrend(trendData);
        setByType(typeData);
      } catch (error) {
        console.error('Error loading customers analytics:', error);
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
          Clientes
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

  const chartData =
    topCustomers?.data?.map((customer: any) => ({
      name: customer.customerName,
      gastado: customer.totalSpent,
      ordenes: customer.totalOrders,
    })) || [];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Clientes
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clientes */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Clientes
          </h3>

          {/* Tabla */}
          <div className="mb-6 overflow-x-auto">
            {topCustomers?.data && topCustomers.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-gray-700">
                    <TableHead className="text-gray-700 dark:text-gray-300">
                      Cliente
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300 text-right">
                      Órdenes
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300 text-right">
                      Total Gastado
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.data.slice(0, 5).map((customer: any) => (
                    <TableRow
                      key={customer.customerId}
                      className="border-gray-200 dark:border-gray-700"
                    >
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        {customer.customerName}
                      </TableCell>
                      <TableCell className="text-right text-gray-900 dark:text-white">
                        {customer.totalOrders}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary-600 dark:text-primary-400">
                        {formatCurrency(customer.totalSpent)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                No hay datos de clientes disponibles
              </div>
            )}
          </div>

          {/* Gráfico */}
          {chartData.length > 0 && (
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData.slice(0, 5)}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-gray-200 dark:stroke-gray-700"
                  />
                  <XAxis
                    dataKey="name"
                    className="text-xs"
                    stroke="#9CA3AF"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    className="text-xs"
                    stroke="#9CA3AF"
                    tickFormatter={(value) => formatCurrencyShort(value)}
                  />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    labelFormatter={(label) => `Cliente: ${label}`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Bar
                    dataKey="gastado"
                    name="Gastado"
                    fill="#3B82F6"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Tendencia y Tipos */}
        <div className="space-y-6">
          {/* AreaChart - Nuevos Clientes */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Nuevos Clientes
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total:{' '}
                <span className="font-bold text-primary-600 dark:text-primary-400">
                  {newTrend?.total || 0}
                </span>
              </p>
              {newTrend?.percentageChange !== null &&
                newTrend?.percentageChange !== undefined && (
                  <p
                    className={`text-sm font-semibold flex items-center gap-1 ${getChangeColor(
                      newTrend.percentageChange
                    )}`}
                  >
                    <span>{getChangeIcon(newTrend.percentageChange)}</span>
                    <span>{formatPercent(newTrend.percentageChange)}</span>
                  </p>
                )}
            </div>
            {newTrend?.data && newTrend.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={newTrend.data}>
                  <defs>
                    <linearGradient
                      id="colorNewCustomers"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-gray-200 dark:stroke-gray-700"
                  />
                  <XAxis dataKey="date" className="text-xs" stroke="#9CA3AF" />
                  <YAxis className="text-xs" stroke="#9CA3AF" />
                  <Tooltip
                    labelFormatter={(label) => `Fecha: ${label}`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Nuevos Clientes"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorNewCustomers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                No hay datos disponibles
              </div>
            )}
          </Card>

          {/* PieChart - Clientes por Tipo */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Por Tipo
            </h3>
            {byType && byType.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={byType}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry: any) => `${entry.label}: ${entry.value}`}
                  >
                    {byType.map((_: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                No hay datos disponibles
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
