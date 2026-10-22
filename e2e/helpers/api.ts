// Datos de prueba creados directamente en la API de desarrollo (:3150).
// Todo es ficticio: este repositorio es público.
const API = process.env.E2E_API_URL ?? 'http://localhost:3150';

export interface StaffApi {
  get<T = any>(path: string): Promise<T>;
  post<T = any>(path: string, body?: unknown): Promise<T>;
  patch<T = any>(path: string, body?: unknown): Promise<T>;
}

export function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
}

let cachedToken: string | null = null;

/** Cliente HTTP con la sesión del usuario del personal de E2E_STAFF_EMAIL */
export async function staffApi(): Promise<StaffApi> {
  const email = process.env.E2E_STAFF_EMAIL;
  const password = process.env.E2E_STAFF_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Faltan E2E_STAFF_EMAIL / E2E_STAFF_PASSWORD (usa ./dev.sh e2e)'
    );
  }
  if (!cachedToken) {
    const login = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!login.ok) throw new Error(`Login del personal falló: ${login.status}`);
    cachedToken = (await login.json()).accessToken as string;
  }
  const accessToken = cachedToken;

  const call = async (method: string, path: string, body?: unknown) => {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        `${method} ${path} → ${res.status}: ${JSON.stringify(data)}`
      );
    }
    return data;
  };
  return {
    get: (path) => call('GET', path),
    post: (path, body) => call('POST', path, body ?? {}),
    patch: (path, body) => call('PATCH', path, body ?? {}),
  };
}

export async function createTestCustomer(
  api: StaffApi,
  name: string
): Promise<string> {
  const customer = await api.post('/customers', {
    customerType: 'JURIDICA',
    businessName: `${name} Prueba ${uniqueSuffix()}`,
    documentType: 'NIT',
    documentNumber: String(Math.floor(1e9 + Math.random() * 8e9)),
    phoneNumber: '6040000000',
  });
  return customer.id;
}

export async function createContract(
  api: StaffApi,
  customerId: string,
  body: Record<string, unknown> = {}
) {
  return api.post('/helpdesk/contracts', {
    customerId,
    monthlyHours: 18,
    startDate: '2026-01-01',
    ...body,
  });
}

export async function createPortalUser(
  api: StaffApi,
  customerId: string,
  role: 'CLIENT_ADMIN' | 'CLIENT_USER'
): Promise<{
  id: string;
  email: string;
  temporaryPassword: string;
  name: string;
}> {
  const name = role === 'CLIENT_ADMIN' ? 'Ana Administradora' : 'Luis Usuario';
  const user = await api.post(
    `/helpdesk/customers/${customerId}/portal-users`,
    {
      name,
      email: `persona.${uniqueSuffix()}@empresa-prueba.test`,
      phone: '3001234567',
      role,
    }
  );
  return {
    id: user.id,
    email: user.email,
    temporaryPassword: user.temporaryPassword,
    name,
  };
}
