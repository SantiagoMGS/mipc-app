import { expect, test } from '@playwright/test';
import {
  createContract,
  createPortalTicket,
  createPortalUser,
  createTestCustomer,
  staffApi,
} from './helpers/api';
import { loginStaff } from './helpers/login';

test('un ticket del portal llega a la campana y al abrirlo queda leído', async ({
  page,
}) => {
  const api = await staffApi();
  // Las otras pruebas dejan avisos en la base de desarrollo
  await api.post('/notifications/read-all');
  const customerId = await createTestCustomer(api, 'Avisos');
  await createContract(api, customerId);
  const user = await createPortalUser(api, customerId, 'CLIENT_USER');
  await loginStaff(page);

  const bell = page.getByRole('button', { name: /^Avisos/ });
  await expect(bell).toBeVisible();
  await expect(page.getByTestId('notification-count')).toHaveCount(0);

  const ticket = await createPortalTicket(user.email, user.temporaryPassword);
  // La campana consulta cada minuto; en la prueba se recarga
  await page.reload();
  await expect(page.getByTestId('notification-count')).toHaveText('1');

  await bell.click();
  await page
    .getByRole('dialog', { name: 'Avisos' })
    .getByRole('link', { name: new RegExp(ticket.number) })
    .click();

  await expect(page).toHaveURL(
    new RegExp(`/dashboard/mesa-de-ayuda/${ticket.id}$`)
  );
  await expect(page.getByTestId('notification-count')).toHaveCount(0);
});

test('marcar todo como leído deja la campana en cero', async ({ page }) => {
  const api = await staffApi();
  await api.post('/notifications/read-all');
  const customerId = await createTestCustomer(api, 'Avisos Todo');
  await createContract(api, customerId);
  const user = await createPortalUser(api, customerId, 'CLIENT_USER');
  await createPortalTicket(user.email, user.temporaryPassword);
  await createPortalTicket(user.email, user.temporaryPassword, {
    subject: 'Segundo problema',
  });
  await loginStaff(page);

  await expect(page.getByTestId('notification-count')).toHaveText('2');
  await page.getByRole('button', { name: /^Avisos/ }).click();
  await page.getByRole('button', { name: 'Marcar todo como leído' }).click();

  await expect(page.getByTestId('notification-count')).toHaveCount(0);
});

test('en el celular la lista de avisos cabe en la pantalla', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginStaff(page);

  await page.getByRole('button', { name: /^Avisos/ }).click();
  const box = await page.getByRole('dialog', { name: 'Avisos' }).boundingBox();

  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
});
