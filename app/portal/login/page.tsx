'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { customerAuthService } from '@/lib/api';
import { Lock, CreditCard, AlertCircle, Eye, EyeOff } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function PortalLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    documentNumber: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Si ya está autenticado como cliente, validar token y redirigir al portal
    const checkExistingSession = async () => {
      const token = localStorage.getItem('customerToken');
      if (token) {
        try {
          const validation = await customerAuthService.validate();
          if (validation.valid) {
            router.push('/portal');
          } else {
            // Token inválido, limpiar
            localStorage.removeItem('customerToken');
            localStorage.removeItem('customerName');
          }
        } catch {
          // Error de red, dejar al usuario en login
          localStorage.removeItem('customerToken');
          localStorage.removeItem('customerName');
        }
      }
    };
    checkExistingSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await customerAuthService.login(
        formData.documentNumber,
        formData.password
      );

      if (response.accessToken) {
        // Guardar en cookie para middleware
        document.cookie = `customerToken=${response.accessToken}; path=/; max-age=${
          60 * 60 * 24 * 7
        }; SameSite=Strict`;
      }

      router.replace('/portal');
    } catch (err: any) {
      console.error('Error en login:', err);

      let errorMessage =
        'Error al iniciar sesión. Verifica tus credenciales.';

      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMessage =
          'No se pudo conectar con el servidor. Intenta de nuevo más tarde.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo_mipc_tec.png"
              alt="MIPC Logo"
              width={180}
              height={180}
              priority
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Portal de Clientes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Consulta el estado de tus equipos y órdenes de servicio
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="documentNumber"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Número de Documento
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CreditCard className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="documentNumber"
                name="documentNumber"
                type="text"
                required
                value={formData.documentNumber}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ingresa tu número de documento"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ingresa tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                Iniciando sesión...
              </>
            ) : (
              'Ingresar al Portal'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Si no tienes contraseña, contacta al administrador
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2025 MIPC. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
