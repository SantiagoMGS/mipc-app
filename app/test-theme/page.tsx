'use client';

import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

export default function TestThemePage() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen p-8 bg-white dark:bg-gray-900">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Test de Tema
        </h1>

        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
          <p className="text-gray-900 dark:text-white mb-4">
            Tema actual: <strong>{theme}</strong>
          </p>
          <ThemeToggle />
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-primary-50 dark:bg-primary-900 rounded-lg">
            <p className="text-primary-900 dark:text-primary-100">
              Este texto debería cambiar de color
            </p>
          </div>

          <div className="p-4 border-2 border-gray-300 dark:border-gray-700 rounded-lg">
            <p className="text-gray-700 dark:text-gray-300">
              Border que cambia en dark mode
            </p>
          </div>

          <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg">
            Botón de prueba
          </button>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Si el botón no funciona, verifica la consola del navegador
          </p>
        </div>
      </div>
    </div>
  );
}
