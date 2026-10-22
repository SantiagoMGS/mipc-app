import { expect, test } from '@playwright/test';
import {
  createContract,
  createTestCustomer,
  staffApi,
  uniqueSuffix,
} from './helpers/api';
import { expectNoHorizontalOverflow, loginStaff } from './helpers/login';

const CRITERIA = [
  'Interrupción general o servidor no disponible',
  'Usuario o función clave sin alternativa',
  'Afectación parcial con alternativa temporal',
  'Configuración, instalación o requerimiento programable',
];

test('ADMIN crea el contrato desde el detalle del cliente', async ({
  page,
}) => {
  const customerId = await createTestCustomer(await staffApi(), 'Contrato');
  await loginStaff(page);
  await page.goto(`/dashboard/clientes/${customerId}`);

  const section = page.getByRole('region', { name: 'Mesa de ayuda' });
  await section.getByRole('button', { name: 'Crear contrato' }).click();
  await section.getByLabel('Horas al mes').fill('18');
  await section.getByLabel('Fecha de inicio').fill('2026-11-01');
  await section.getByRole('button', { name: 'Guardar contrato' }).click();

  await expect(section.getByText('18 h al mes')).toBeVisible();
  await expect(
    section.getByText('Lunes a viernes, 7:00 a 17:00')
  ).toBeVisible();
  for (const criterion of CRITERIA) {
    await expect(section.getByText(criterion)).toBeVisible();
  }
});

test('crea un usuario del portal y muestra la contraseña temporal una vez', async ({
  page,
}) => {
  const api = await staffApi();
  const customerId = await createTestCustomer(api, 'Usuarios');
  await createContract(api, customerId);
  await loginStaff(page);
  await page.goto(`/dashboard/clientes/${customerId}`);

  const section = page.getByRole('region', { name: 'Usuarios del portal' });
  await section.getByRole('button', { name: 'Agregar usuario' }).click();
  const form = page.getByRole('dialog', { name: 'Agregar usuario del portal' });
  await form.getByLabel('Nombre').fill('Ana Prueba');
  // Único por corrida: los datos de prueba quedan en mipc_dev
  const email = `ana.${uniqueSuffix()}@empresa-prueba.test`;
  await form.getByLabel('Correo').fill(email);
  await form.getByLabel('Celular').fill('3001234567');
  await form.getByLabel('Rol').selectOption('CLIENT_ADMIN');
  await form.getByRole('button', { name: 'Crear usuario' }).click();

  const dialog = page.getByRole('dialog', { name: 'Contraseña temporal' });
  const password = (await dialog
    .getByTestId('temporary-password')
    .textContent())!.trim();
  expect(password).toHaveLength(12);
  await dialog.getByRole('button', { name: 'Listo' }).click();

  await expect(section.getByText(email, { exact: false })).toBeVisible();
  await expect(page.getByText(password)).toHaveCount(0);
});

test('en el celular las secciones no se desbordan', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const api = await staffApi();
  const customerId = await createTestCustomer(api, 'Celular');
  await createContract(api, customerId);
  await loginStaff(page);
  await page.goto(`/dashboard/clientes/${customerId}`);

  await expect(
    page.getByRole('region', { name: 'Mesa de ayuda' })
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Usuarios del portal' })
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
