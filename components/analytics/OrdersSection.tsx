'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  analyticsService,
  formatPercent,
  getChangeColor,
  getChangeIcon,
  AnalyticsParams,
} from '@/lib/analytics';
import { Clock, TrendingUp, Package } from 'lucide-react';

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
];

interface OrdersSectionProps {
  params: AnalyticsParams;
}

export function OrdersSection({ params }: OrdersSectionProps) {
  const [byStatus, setByStatus] = useState<any>(null);
  const [trend, setTrend] = useState<any>(null);
  const [avgTime, setAvgTime] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [statusData, trendData, timeData] = await Promise.all([
          analyticsService.getOrdersByStatus(params),
          analyticsService.getOrdersTrend({ ...params, compare: true }),
          analyticsService.getAverageTime(params),
        ]);
        setByStatus(statusData);
        setTrend(trendData);
        setAvgTime(timeData);
      } catch (error) {
        console.error('Error loading orders analytics:', error);
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
          Órdenes de Servicio
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-[250px] bg-gray-100 dark:bg-gray-800 rounded"></div>
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
        Órdenes de Servicio
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PieChart - Órdenes por Estado */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Por Estado
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Total:{' '}
            <span className="font-bold text-primary-600 dark:text-primary-400">
              {byStatus?.total || 0}
            </span>{' '}
            órdenes
          </p>
          {byStatus?.data && byStatus.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={byStatus.data}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry: any) =>
                    `${entry.label}: ${(entry.percent * 100).toFixed(0)}%`
                  }
                >
                  {byStatus.data.map((_: any, index: number) => (
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
            <div className="h-[250px] flex items-center justify-center text-gray-400 dark:text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </Card>

        {/* LineChart - Tendencia */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tendencia
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total:{' '}
              <span className="font-bold text-primary-600 dark:text-primary-400">
                {trend?.total || 0}
              </span>
            </p>
            {trend?.percentageChange !== null &&
              trend?.percentageChange !== undefined && (
                <p
                  className={`text-sm font-semibold flex items-center gap-1 ${getChangeColor(
                    trend.percentageChange
                  )}`}
                >
                  <span>{getChangeIcon(trend.percentageChange)}</span>
                  <span>{formatPercent(trend.percentageChange)}</span>
                </p>
              )}
          </div>
          {trend?.data && trend.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trend.data}>
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
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Órdenes"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 dark:text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </Card>

        {/* Cards - Métricas */}
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Promedio Días
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {avgTime?.averageDays?.toFixed(1) || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Promedio Horas
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {avgTime?.averageHours?.toFixed(1) || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Órdenes
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {avgTime?.totalOrders || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
