import { expect, test } from '@playwright/test';
import {
  createContract,
  createPortalUser,
  createStaffTicket,
  createTestCustomer,
  staffApi,
} from './helpers/api';
import {
  expectNoHorizontalOverflow,
  loginPortal,
  loginStaff,
} from './helpers/login';

/** Mes 'AAAA-MM' de un instante en Bogotá (UTC−5) */
function bogotaMonth(date: Date): string {
  return new Date(date.getTime() - 5 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 7);
}

/** Empresa con contrato de 18 h y un ticket resuelto hace un rato con 1 h 15 min */
async function companyWithResolvedTicket() {
  const api = await staffApi();
  const customerId = await createTestCustomer(api, 'Resumen');
  const contract = await createContract(api, customerId);
  const user = await createPortalUser(api, customerId, 'CLIENT_USER');
  const now = Date.now();
  const resolvedAt = new Date(now - 30 * 60 * 1000);
  await createStaffTicket(api, customerId, user.id, {
    receivedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    resolved: {
      firstResponseAt: new Date(now - 60 * 60 * 1000).toISOString(),
      resolvedAt: resolvedAt.toISOString(),
      billableMinutes: 75,
      resolutionNote: 'Se configuró la VPN.',
    },
  });
  return {
    api,
    customerId,
    contractId: contract.id,
    month: bogotaMonth(resolvedAt),
  };
}

test('ADMIN ve el resumen de un contrato con 1 h 15 min usadas', async ({
  page,
}) => {
  const { contractId, month } = await companyWithResolvedTicket();
  await loginStaff(page);
  await page.goto(
    `/dashboard/mesa-de-ayuda/resumen?contrato=${contractId}&mes=${month}`
  );

  await expect(
    page.getByRole('group', { name: 'Bolsa del mes' })
  ).toContainText('18 h');
  await expect(page.getByRole('group', { name: 'Usado' })).toContainText(
    '1 h 15 min'
  );
  await expect(page.getByRole('group', { name: 'Disponible' })).toContainText(
    '16 h 45 min'
  );
  await expect(page.getByRole('group', { name: 'Extra' })).toContainText(
    '0 min'
  );
  await expect(page.getByText('Se configuró la VPN.')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /TK-\d{2}-\d{4}/ })).toHaveCount(
    1
  );
});

test('ADMIN cierra un mes anterior', async ({ page }) => {
  const api = await staffApi();
  const customerId = await createTestCustomer(api, 'Cierre');
  const contract = await createContract(api, customerId);
  const user = await createPortalUser(api, customerId, 'CLIENT_USER');
  await createStaffTicket(api, customerId, user.id, {
    receivedAt: '2026-09-10T08:00:00-05:00',
    resolved: {
      firstResponseAt: '2026-09-10T08:30:00-05:00',
      resolvedAt: '2026-09-10T10:00:00-05:00',
      billableMinutes: 30,
      resolutionNote: 'Listo',
    },
  });
  await loginStaff(page);
  await page.goto(
    `/dashboard/mesa-de-ayuda/resumen?contrato=${contract.id}&mes=2026-09`
  );

  await page.getByRole('button', { name: 'Cerrar mes' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cerrar mes' })
    .click();

  await expect(page.getByText('Cerrado', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cerrar mes' })).toHaveCount(0);
});

test.describe('en el portal (390 px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('el CLIENT_ADMIN ve sus horas; el CLIENT_USER no tiene "Horas"', async ({
    browser,
  }) => {
    const { api, customerId } = await companyWithResolvedTicket();
    const admin = await createPortalUser(api, customerId, 'CLIENT_ADMIN');
    const user = await createPortalUser(api, customerId, 'CLIENT_USER');

    const adminPage = await (
      await browser.newContext({ viewport: { width: 390, height: 844 } })
    ).newPage();
    await loginPortal(adminPage, admin.email, admin.temporaryPassword);
    await adminPage
      .getByRole('navigation', { name: 'Portal' })
      .getByRole('link', { name: 'Horas' })
      .click();
    await expect(adminPage).toHaveURL(/\/portal\/horas$/);
    await expect(adminPage.getByRole('group', { name: 'Usado' })).toContainText(
      '1 h 15 min'
    );
    await expectNoHorizontalOverflow(adminPage);

    const userPage = await (
      await browser.newContext({ viewport: { width: 390, height: 844 } })
    ).newPage();
    await loginPortal(userPage, user.email, user.temporaryPassword);
    await expect(
      userPage.getByRole('navigation', { name: 'Portal' })
    ).toBeVisible();
    await expect(
      userPage
        .getByRole('navigation', { name: 'Portal' })
        .getByRole('link', { name: 'Horas' })
    ).toHaveCount(0);
    await userPage.goto('/portal/horas');
    await expect(userPage).toHaveURL(/\/portal\/mesa-de-ayuda$/);
  });
});
