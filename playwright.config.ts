import { defineConfig, devices } from '@playwright/test';

// Pruebas e2e contra el entorno de desarrollo del servidor:
// ./dev.sh api y ./dev.sh app deben estar corriendo (ver ~/mipc/CLAUDE.md).
export default defineConfig({
  testDir: 'e2e',
  workers: 1,
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3100',
    locale: 'es-CO',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
