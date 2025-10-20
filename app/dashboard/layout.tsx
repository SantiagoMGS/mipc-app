'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Menu,
  X,
  LogOut,
  Package,
  Users,
  Cpu,
  Home,
  ClipboardList,
  UserCog,
} from 'lucide-react';
import { authService } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ViewModeProvider } from '@/contexts/ViewModeContext';
import { USER_ROLE_LABELS, UserRole } from '@/types/user';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Cerrado por defecto en móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState('Usuario');
  const [userRole, setUserRole] = useState('');
  const [userInitial, setUserInitial] = useState('U');

  useEffect(() => {
    // Decodificar el JWT token para obtener el nombre y rol
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);

        // Extraer nombre y tomar la primera palabra
        if (payload.name) {
          const firstName = payload.name.split(' ')[0];
          setUserName(firstName);
          setUserInitial(firstName.charAt(0).toUpperCase());
        }

        // Extraer rol y usar el label en español
        if (payload.role) {
          const roleLabel = USER_ROLE_LABELS[payload.role as UserRole];
          setUserRole(roleLabel || payload.role);
        }
      } catch (error) {
        console.error('Error decoding JWT token:', error);
      }
    }
  }, []);

  const menuItems = [
    {
      name: 'Inicio',
      icon: Home,
      path: '/dashboard',
    },
    {
      name: 'Órdenes de Servicio',
      icon: ClipboardList,
      path: '/dashboard/ordenes-servicio',
    },
    {
      name: 'Productos',
      icon: Package,
      path: '/dashboard/productos',
    },
    {
      name: 'Clientes',
      icon: Users,
      path: '/dashboard/clientes',
    },
    {
      name: 'Tipos de Dispositivo',
      icon: Cpu,
      path: '/dashboard/tipos-dispositivo',
    },
    {
      name: 'Usuarios',
      icon: UserCog,
      path: '/dashboard/usuarios',
    },
  ];

  const handleLogout = () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      authService.logout();
    }
  };

  const handleMenuItemClick = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false); // Cerrar menú móvil al navegar
  };

  return (
    <ProtectedRoute>
      <ViewModeProvider>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
          {/* Sidebar Desktop - Oculto en móvil */}
          <aside
            className={`${
              isSidebarOpen ? 'w-64' : 'w-20'
            } bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out flex-col hidden lg:flex`}
          >
            {/* Logo Section */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
              {isSidebarOpen ? (
                <div className="flex items-center">
                  <Image
                    src="/logo_mipc_tec.png"
                    alt="MIPC Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <Image
                    src="/logo_mipc_tec.png"
                    alt="MIPC Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
              )}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 px-3 py-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isSidebarOpen && (
                      <span className="font-medium">{item.name}</span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && (
                  <span className="font-medium">Cerrar Sesión</span>
                )}
              </button>
            </div>
          </aside>

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div
                className="bg-white dark:bg-gray-800 w-64 h-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile Menu Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <Image
                      src="/logo_mipc_tec.png"
                      alt="MIPC Logo"
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Mobile Menu Items */}
                <nav className="px-3 py-4 space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path;

                    return (
                      <button
                        key={item.path}
                        onClick={() => handleMenuItemClick(item.path)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary-500 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{item.name}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Mobile Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 px-3 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {/* Top Bar */}
            <header className="h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between px-4 md:px-6">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>

              <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">
                Sistema de Gestión
              </h2>

              <div className="flex items-center gap-2 md:gap-4">
                {/* Theme Toggle */}
                <ThemeToggle />

                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {userRole}
                  </p>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm md:text-base">
                  {userInitial}
                </div>
              </div>
            </header>

            {/* Page Content */}
            <div className="p-4 md:p-6">{children}</div>
          </main>
        </div>
      </ViewModeProvider>
    </ProtectedRoute>
  );
}
