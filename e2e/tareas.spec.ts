import { expect, Page, test } from '@playwright/test';
import { staffApi, uniqueSuffix } from './helpers/api';
import { loginStaff } from './helpers/login';

// Tamaño de celular: ahí se reportó que los items no se podían editar
test.use({ viewport: { width: 390, height: 844 } });

async function createTask() {
  const api = await staffApi();
  const task = await api.post('/tasks', {
    customer: `Cliente E2E ${uniqueSuffix()}`,
    description: 'Viaje de prueba',
    items: [
      { name: 'Transporte', quantity: 1, price: 50000 },
      { name: 'Hotel', quantity: 1, price: 150000 },
    ],
  });
  return { api, task };
}

// Los campos de las filas tienen aria-label; los de "agregar" solo placeholder
const rowName = (page: Page) =>
  page.getByLabel('Nombre del item', { exact: true });
const rowQuantity = (page: Page) =>
  page.getByLabel('Cantidad', { exact: true });
const rowPrice = (page: Page) => page.getByLabel('Precio', { exact: true });

test('en el celular se editan nombre, cantidad y precio de los items', async ({
  page,
}) => {
  const { api, task } = await createTask();
  await loginStaff(page);
  await page.goto(`/dashboard/tareas/${task.id}`);
  await page.getByRole('button', { name: 'Editar' }).click();

  await expect(rowName(page)).toHaveCount(2);
  // Antes la tabla cortaba el precio a la derecha
  await rowPrice(page).nth(1).scrollIntoViewIfNeeded();
  await expect(rowPrice(page).nth(1)).toBeInViewport({ ratio: 1 });

  await rowName(page).nth(1).fill('Hotel Normandía Gold');
  await rowQuantity(page).nth(1).fill('2');
  await rowPrice(page).nth(1).fill('180000');
  await expect(page.getByText('Modificado', { exact: false })).toBeVisible();

  // Un item nuevo también se corrige antes de guardar
  await page.getByPlaceholder('Nombre del item').fill('Almuerzo');
  await page.getByPlaceholder('Precio').fill('20000');
  await page.getByRole('button', { name: 'Agregar' }).click();
  await rowQuantity(page).nth(2).fill('3');

  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('button', { name: 'Guardar' })).toHaveCount(0);

  const saved = await api.get(`/tasks/${task.id}`);
  expect(
    saved.taskItems.map(({ name, quantity, price }: any) => ({
      name,
      quantity,
      price,
    }))
  ).toEqual([
    { name: 'Transporte', quantity: 1, price: 50000 },
    { name: 'Hotel Normandía Gold', quantity: 2, price: 180000 },
    { name: 'Almuerzo', quantity: 3, price: 20000 },
  ]);
  await expect(page.getByText('Hotel Normandía Gold')).toBeVisible();
});

test('no guarda un item con la cantidad vacía', async ({ page }) => {
  const { api, task } = await createTask();
  await loginStaff(page);
  await page.goto(`/dashboard/tareas/${task.id}`);
  await page.getByRole('button', { name: 'Editar' }).click();

  await rowQuantity(page).nth(0).fill('');
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(
    page.getByText(/La cantidad debe ser un número entero de al menos 1/)
  ).toBeVisible();
  const saved = await api.get(`/tasks/${task.id}`);
  expect(saved.taskItems[0].quantity).toBe(1);
});
