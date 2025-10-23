/**
 * Utilidades para manejo de autenticación y tokens JWT
 */

export interface JWTPayload {
  sub: string; // User ID
  email?: string;
  name?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

/**
 * Decodifica un token JWT y retorna el payload
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('Error al decodificar JWT:', error);
    return null;
  }
}

/**
 * Obtiene el ID del usuario del token almacenado en localStorage
 */
export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem('authToken');
  if (!token) {
    return null;
  }

  const payload = decodeJWT(token);
  return payload?.sub || null;
}

/**
 * Obtiene la información completa del payload del token actual
 */
export function getCurrentUserPayload(): JWTPayload | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem('authToken');
  if (!token) {
    return null;
  }

  return decodeJWT(token);
}

/**
 * Verifica si el token ha expirado
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload?.exp) {
    return false;
  }

  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  return currentTime > expirationTime;
}

/**
 * Obtiene el rol del usuario actual desde el token
 */
export function getCurrentUserRole(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem('authToken');
  if (!token) {
    return null;
  }

  const payload = decodeJWT(token);
  return payload?.role || null;
}

/**
 * Verifica si el usuario actual tiene un rol específico
 */
export function hasRole(role: string): boolean {
  const currentRole = getCurrentUserRole();
  return currentRole === role;
}

/**
 * Verifica si el usuario actual es administrador
 */
export function isAdmin(): boolean {
  return hasRole('ADMIN');
}
