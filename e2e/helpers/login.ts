import { expect, Page } from '@playwright/test';

/** Inicia sesión en el panel con el usuario del personal de E2E_STAFF_EMAIL */
export async function loginStaff(page: Page): Promise<void> {
  await page.goto('/login');
  await page.fill('#email', process.env.E2E_STAFF_EMAIL!);
  await page.fill('#password', process.env.E2E_STAFF_PASSWORD!);
  await page.click('button[type=submit]');
  await expect(page).toHaveURL(/\/dashboard/);
}

/** Ninguna parte del panel se desborda a lo ancho */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const main = document.querySelector('main');
    const doc = document.documentElement;
    return {
      doc: doc.scrollWidth - doc.clientWidth,
      main: main ? main.scrollWidth - main.clientWidth : 0,
    };
  });
  expect(overflow).toEqual({ doc: 0, main: 0 });
}

/**
 * Inicia sesión en el portal (correo o documento). Si pide cambiar la
 * contraseña temporal, la cambia por `newPassword`.
 */
export async function loginPortal(
  page: Page,
  identifier: string,
  password: string,
  newPassword = 'Portal123*'
): Promise<void> {
  await page.goto('/portal/login');
  await page.fill('#identifier', identifier);
  await page.fill('#password', password);
  await page.click('button[type=submit]');
  await page.waitForURL(/\/portal(\/|$)(?!login)/);
  if (page.url().includes('/portal/cambiar-clave')) {
    await page.fill('#currentPassword', password);
    await page.fill('#newPassword', newPassword);
    await page.fill('#confirmPassword', newPassword);
    await page.click('button[type=submit]');
    await page.waitForURL((url) => !url.pathname.includes('cambiar-clave'));
  }
}
