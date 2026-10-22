import { expect, test } from '@playwright/test';
import {
  createContract,
  createPortalUser,
  createStaffTicket,
  createTestCustomer,
  staffApi,
} from './helpers/api';
import { loginPortal } from './helpers/login';

test.use({ viewport: { width: 390, height: 844 } });

// PNG de 1×1
const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d4948445200000001000000010806000000' +
    '1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082',
  'hex'
);

async function companyWithContract() {
  const api = await staffApi();
  const customerId = await createTestCustomer(api, 'Portal Tickets');
  await createContract(api, customerId);
  return { api, customerId };
}

test('CLIENT_USER crea un ticket Alta con una captura', async ({ page }) => {
  const { api, customerId } = await companyWithContract();
  const user = await createPortalUser(api, customerId, 'CLIENT_USER');
  await loginPortal(page, user.email, user.temporaryPassword);

  await page.getByRole('link', { name: 'Nuevo ticket' }).click();
  await page.getByLabel('Asunto').fill('No hay internet en recepción');
  await page
    .getByLabel('Descripción')
    .fill('Desde las 8 el computador de recepción no navega.');
  await page.getByRole('radio', { name: /Alta/ }).check();
  await page.getByLabel('Capturas (opcional)').setInputFiles({
    name: 'captura.png',
    mimeType: 'image/png',
    buffer: PNG,
  });
  await page.getByRole('button', { name: 'Enviar ticket' }).click();

  await expect(page).toHaveURL(/\/portal\/mesa-de-ayuda\/[0-9a-f-]{36}$/);
  await expect(page.getByText('Abierto').first()).toBeVisible();
  await expect(
    page.getByText('Respuesta en hasta 2 horas hábiles')
  ).toBeVisible();
  await expect(page.getByAltText('captura.png')).toBeVisible();
});

test('un compañero CLIENT_USER no ve el ticket; el CLIENT_ADMIN sí', async ({
  browser,
}) => {
  const { api, customerId } = await companyWithContract();
  const owner = await createPortalUser(api, customerId, 'CLIENT_USER');
  const colleague = await createPortalUser(api, customerId, 'CLIENT_USER');
  const admin = await createPortalUser(api, customerId, 'CLIENT_ADMIN');
  const ticket = await createStaffTicket(api, customerId, owner.id, {
    subject: 'Correo de Luis lleno',
  });

  const colleaguePage = await (await browser.newContext()).newPage();
  await loginPortal(
    colleaguePage,
    colleague.email,
    colleague.temporaryPassword
  );
  await expect(
    colleaguePage.getByRole('heading', { name: 'Mesa de ayuda' })
  ).toBeVisible();
  await expect(colleaguePage.getByText('Correo de Luis lleno')).toHaveCount(0);
  await colleaguePage.goto(`/portal/mesa-de-ayuda/${ticket.id}`);
  await expect(
    colleaguePage.getByText('No encontramos este ticket')
  ).toBeVisible();

  const adminPage = await (await browser.newContext()).newPage();
  await loginPortal(adminPage, admin.email, admin.temporaryPassword);
  await adminPage.goto('/portal/mesa-de-ayuda');
  const row = adminPage.getByRole('link', { name: /Correo de Luis lleno/ });
  await expect(row).toBeVisible();
  await expect(row.getByText(owner.name)).toBeVisible();
});

test('cuando el técnico lo resuelve, el usuario ve la nota y el tiempo', async ({
  page,
}) => {
  const { api, customerId } = await companyWithContract();
  const user = await createPortalUser(api, customerId, 'CLIENT_USER');
  const ticket = await createStaffTicket(api, customerId, user.id);
  await api.post(`/helpdesk/tickets/${ticket.id}/take`);
  await api.post(`/helpdesk/tickets/${ticket.id}/resolve`, {
    billableMinutes: 45,
    resolutionNote: 'Se cambió el cable de red del computador.',
  });

  await loginPortal(page, user.email, user.temporaryPassword);
  await page.getByRole('link', { name: /La impresora no imprime/ }).click();

  await expect(
    page.getByText('Se cambió el cable de red del computador.')
  ).toBeVisible();
  await expect(page.getByText('45 min')).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Escribir a MiPC por WhatsApp/ })
  ).toHaveAttribute('href', /^https:\/\/wa\.me\/573148889078\?text=/);
});

test('sin contrato activo no se abren tickets y se ve un aviso', async ({
  page,
}) => {
  const api = await staffApi();
  const customerId = await createTestCustomer(api, 'Sin Contrato');
  const user = await createPortalUser(api, customerId, 'CLIENT_USER');
  await loginPortal(page, user.email, user.temporaryPassword);

  await expect(
    page.getByText('Tu empresa no tiene un contrato de mesa de ayuda activo')
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nuevo ticket' })).toHaveCount(0);
});
