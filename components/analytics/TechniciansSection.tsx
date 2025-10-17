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
  AnalyticsParams,
} from '@/lib/analytics';
import { Users } from 'lucide-react';

interface TechniciansSectionProps {
  params: AnalyticsParams;
}

export function TechniciansSection({ params }: TechniciansSectionProps) {
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await analyticsService.getTechniciansPerformance(params);
        setPerformance(data);
      } catch (error) {
        console.error('Error loading technicians analytics:', error);
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
          Rendimiento de Técnicos
        </h2>
        <Card className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-[300px] bg-gray-100 dark:bg-gray-800 rounded"></div>
          </div>
        </Card>
      </section>
    );
  }

  const chartData =
    performance?.data?.map((tech: any) => ({
      name: tech.technicianName,
      ingresos: tech.totalRevenue,
      ordenes: tech.totalOrders,
    })) || [];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Rendimiento de Técnicos
        </h2>
      </div>

      <Card className="p-6">
        {/* Tabla de Técnicos */}
        <div className="mb-8 overflow-x-auto">
          {performance?.data && performance.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 dark:border-gray-700">
                  <TableHead className="text-gray-700 dark:text-gray-300">
                    Técnico
                  </TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300 text-right">
                    Total Órdenes
                  </TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300 text-right">
                    Completadas
                  </TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300 text-right">
                    Promedio Días
                  </TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300 text-right">
                    Ingresos Totales
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performance.data.map((tech: any) => (
                  <TableRow
                    key={tech.technicianId}
                    className="border-gray-200 dark:border-gray-700"
                  >
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      {tech.technicianName}
                    </TableCell>
                    <TableCell className="text-right text-gray-900 dark:text-white">
                      {tech.totalOrders}
                    </TableCell>
                    <TableCell className="text-right text-gray-900 dark:text-white">
                      {tech.completedOrders}
                    </TableCell>
                    <TableCell className="text-right text-gray-900 dark:text-white">
                      {tech.averageDays?.toFixed(1) || 0}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary-600 dark:text-primary-400">
                      {formatCurrency(tech.totalRevenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              No hay datos de técnicos disponibles
            </div>
          )}
        </div>

        {/* Gráfico de Ingresos por Técnico */}
        {chartData.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Ingresos por Técnico
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
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
                  labelFormatter={(label) => `Técnico: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                  }}
                />
                <Bar
                  dataKey="ingresos"
                  name="Ingresos"
                  fill="#8B5CF6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </section>
  );
}
