import { expect, test } from '@playwright/test';
import {
  createContract,
  createDocumentCustomer,
  createPortalUser,
  createTestCustomer,
  staffApi,
  uniqueSuffix,
} from './helpers/api';
import { loginPortal } from './helpers/login';

test.use({ viewport: { width: 390, height: 844 } });

test('un usuario de empresa entra con su correo y cambia la contraseña', async ({
  page,
}) => {
  const api = await staffApi();
  const customerId = await createTestCustomer(api, 'Portal');
  await createContract(api, customerId);
  const user = await createPortalUser(api, customerId, 'CLIENT_USER');

  await loginPortal(page, user.email, user.temporaryPassword);

  await expect(page).toHaveURL(/\/portal\/mesa-de-ayuda$/);
  await expect(page.getByRole('navigation', { name: 'Portal' })).toBeVisible();
});

test('el CLIENT_ADMIN crea un compañero desde Usuarios', async ({ page }) => {
  const api = await staffApi();
  const customerId = await createTestCustomer(api, 'Portal');
  await createContract(api, customerId);
  const admin = await createPortalUser(api, customerId, 'CLIENT_ADMIN');

  await loginPortal(page, admin.email, admin.temporaryPassword);
  await page
    .getByRole('navigation', { name: 'Portal' })
    .getByRole('link', { name: 'Usuarios' })
    .click();
  await expect(page).toHaveURL(/\/portal\/usuarios$/);

  await page.getByRole('button', { name: 'Agregar usuario' }).click();
  const form = page.getByRole('dialog', { name: 'Agregar usuario' });
  const email = `colega.${uniqueSuffix()}@empresa-prueba.test`;
  await form.getByLabel('Nombre').fill('Colega Prueba');
  await form.getByLabel('Correo').fill(email);
  await form.getByLabel('Celular').fill('3005556677');
  await form.getByRole('button', { name: 'Crear usuario' }).click();

  const dialog = page.getByRole('dialog', { name: 'Contraseña temporal' });
  expect(
    (await dialog.getByTestId('temporary-password').textContent())!.trim()
  ).toHaveLength(12);
  await dialog.getByRole('button', { name: 'Listo' }).click();
  await expect(page.getByText(email)).toBeVisible();
});

test('el CLIENT_USER no ve Usuarios ni puede entrar a esa página', async ({
  page,
}) => {
  const api = await staffApi();
  const customerId = await createTestCustomer(api, 'Portal');
  await createContract(api, customerId);
  const user = await createPortalUser(api, customerId, 'CLIENT_USER');

  await loginPortal(page, user.email, user.temporaryPassword);
  const nav = page.getByRole('navigation', { name: 'Portal' });
  await expect(nav.getByRole('link', { name: 'Mesa de ayuda' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Usuarios' })).toHaveCount(0);

  await page.goto('/portal/usuarios');
  await expect(page).toHaveURL(/\/portal\/mesa-de-ayuda$/);
  await page.goto('/portal');
  await expect(page).toHaveURL(/\/portal\/mesa-de-ayuda$/);
});

test('un cliente de reparación sigue entrando con su documento', async ({
  page,
}) => {
  const customer = await createDocumentCustomer(await staffApi());

  await loginPortal(page, customer.documentNumber, customer.password);

  await expect(page).toHaveURL(/\/portal$/);
  await expect(page.getByText('Mis Equipos')).toBeVisible();
});
