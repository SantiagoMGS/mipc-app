import { expect, test } from '@playwright/test';
import {
  createContract,
  createPortalUser,
  createStaffTicket,
  createTestCustomer,
  staffApi,
  uniqueSuffix,
} from './helpers/api';
import { expectNoHorizontalOverflow, loginStaff } from './helpers/login';

/** Empresa con contrato y un usuario del portal */
async function companyWithUser() {
  const api = await staffApi();
  const customerId = await createTestCustomer(api, 'Tickets');
  await createContract(api, customerId);
  const user = await createPortalUser(api, customerId, 'CLIENT_USER');
  return { api, customerId, user };
}

test('registra a nombre de un usuario un ticket ya resuelto', async ({
  page,
}) => {
  const { customerId, user } = await companyWithUser();
  await loginStaff(page);
  await page.goto('/dashboard/mesa-de-ayuda/nuevo');

  await page.getByLabel('Empresa').selectOption(customerId);
  await page.getByLabel('Solicitante').selectOption(user.id);
  await page.getByLabel('Asunto').fill('Correo no sincroniza');
  await page
    .getByLabel('Descripción')
    .fill('Escribió por WhatsApp: Outlook no descarga correos.');
  await page.getByLabel('Prioridad').selectOption('NORMAL');
  await page.getByLabel('Ya está resuelto').check();
  await page.getByLabel('Tiempo dedicado').selectOption('45');
  await page.getByLabel('Nota de solución').fill('Se reconfiguró la cuenta.');
  await page.getByRole('button', { name: 'Crear ticket' }).click();

  await expect(page).toHaveURL(/\/dashboard\/mesa-de-ayuda\/[0-9a-f-]{36}$/);
  await page.goto(`/dashboard/mesa-de-ayuda?cliente=${customerId}`);
  const row = page.getByRole('link', { name: /Correo no sincroniza/ });
  await expect(row).toBeVisible();
  await expect(row.getByText('Resuelto')).toBeVisible();
  await expect(row.getByText('45 min')).toBeVisible();
});

test('toma un ticket abierto y lo resuelve con 1 h', async ({ page }) => {
  const { api, customerId, user } = await companyWithUser();
  const ticket = await createStaffTicket(api, customerId, user.id);
  await loginStaff(page);
  await page.goto(`/dashboard/mesa-de-ayuda/${ticket.id}`);

  await page.getByRole('button', { name: 'Tomar' }).click();
  const take = page.getByRole('dialog', { name: 'Tomar ticket' });
  await expect(take.getByLabel('Hora de respuesta')).not.toHaveValue('');
  await take.getByRole('button', { name: 'Tomar ticket' }).click();
  await expect(page.getByText('En atención').first()).toBeVisible();

  await page.getByRole('button', { name: 'Resolver' }).click();
  const resolve = page.getByRole('dialog', { name: 'Resolver ticket' });
  await expect(resolve.getByLabel('Hora de solución')).not.toHaveValue('');
  await resolve.getByLabel('Tiempo dedicado').selectOption('60');
  await resolve
    .getByLabel('Nota de solución')
    .fill('Se reinstaló el controlador de la impresora.');
  await resolve.getByRole('button', { name: 'Resolver ticket' }).click();

  const summary = page.getByRole('region', { name: 'Solución' });
  await expect(
    summary.getByText('Se reinstaló el controlador de la impresora.')
  ).toBeVisible();
  await expect(summary.getByText('1 h', { exact: true })).toBeVisible();
  const history = page.getByRole('region', { name: 'Historial' });
  await expect(history.getByText('Tomado')).toBeVisible();
  await expect(history.getByText('Resuelto')).toBeVisible();
});

test('el enlace de WhatsApp apunta al celular del solicitante', async ({
  page,
}) => {
  const { api, customerId, user } = await companyWithUser();
  const ticket = await createStaffTicket(api, customerId, user.id);
  await loginStaff(page);
  await page.goto(`/dashboard/mesa-de-ayuda/${ticket.id}`);

  await expect(
    page.getByRole('link', { name: /Escribir por WhatsApp/ })
  ).toHaveAttribute('href', 'https://wa.me/573001234567');
});

test('ADMIN agrega un festivo y lo quita', async ({ page }) => {
  const name = `Cierre de prueba ${uniqueSuffix()}`;
  await loginStaff(page);
  await page.goto('/dashboard/mesa-de-ayuda/festivos');

  await page.getByLabel('Fecha').fill('2026-12-30');
  await page.getByLabel('Nombre').fill(name);
  await page.getByRole('button', { name: 'Agregar festivo' }).click();

  const row = page.getByRole('listitem').filter({ hasText: name });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Quitar' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Quitar festivo' })
    .click();
  await expect(page.getByText(name)).toHaveCount(0);
});

test('en el celular la lista y el detalle no se desbordan', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { api, customerId, user } = await companyWithUser();
  const ticket = await createStaffTicket(api, customerId, user.id);
  await loginStaff(page);

  await page.goto(`/dashboard/mesa-de-ayuda?cliente=${customerId}`);
  await expect(page.getByText(ticket.number)).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto(`/dashboard/mesa-de-ayuda/${ticket.id}`);
  await expect(page.getByRole('region', { name: 'Historial' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
