import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/', '/login'];
  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  // Si es una ruta pública, permitir acceso
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Para rutas protegidas (dashboard), verificar token
  if (pathname.startsWith('/dashboard')) {
    // Intentar obtener el token de las cookies
    const token = request.cookies.get('authToken')?.value;

    // Si no hay token, redirigir a login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // TODO: Aquí podrías verificar si el token es válido/no ha expirado
    // llamando a un endpoint del backend, pero eso agregaría latencia
    // Por ahora, el interceptor de axios maneja la expiración

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
