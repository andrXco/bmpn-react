import { defineConfig, devices } from '@playwright/test';

// Pruebas de sistema (E2E): navegador real contra el frontend Angular, el backend Spring Boot
// y PostgreSQL. El backend debe estar corriendo antes (docker compose up -d --wait en el repo bmpn).
//
// Variables opcionales:
//   E2E_BASE_URL  URL del frontend           (por defecto http://localhost:4200)
//   E2E_API_URL   URL de la API del backend  (por defecto http://localhost:8080/api)
//   E2E_SIN_SERVIDOR=true  no levanta "ng serve" (por ejemplo, si el frontend corre en Docker)
const baseURL: string = process.env['E2E_BASE_URL'] ?? 'http://localhost:4200';
const enCI: boolean = !!process.env['CI'];

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  // Cada prueba crea sus propias empresas, así que pueden correr en paralelo sin chocar
  fullyParallel: true,
  forbidOnly: enCI,
  retries: enCI ? 1 : 0,
  workers: enCI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }]
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'es-CO'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }
  ],
  webServer: process.env['E2E_SIN_SERVIDOR'] === 'true'
    ? undefined
    : {
        command: 'npm start',
        url: baseURL,
        reuseExistingServer: !enCI,
        timeout: 180_000
      }
});
