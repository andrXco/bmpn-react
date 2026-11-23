import { expect, iniciarSesion, test } from './support/fixtures';

// E2E-01 · Autenticación: inicio y cierre de sesión, rutas protegidas y renovación de la sesión
test.describe('Autenticación', () => {

  test('el usuario inicia sesión y ve su nombre y rol', async ({ page, api }) => {
    const empresa = await api.registrarEmpresa();

    await iniciarSesion(page, empresa.admin.email);

    await expect(page.getByTestId('usuario-sesion')).toContainText('Ana Prueba (ADMINISTRADOR)');
    await expect(page.getByRole('heading', { name: 'Procesos' })).toBeVisible();
  });

  test('una contraseña incorrecta muestra un error y no entra', async ({ page, api }) => {
    const empresa = await api.registrarEmpresa();

    await page.goto('/login');
    await page.locator('#email').fill(empresa.admin.email);
    await page.locator('#password').fill('ClaveEquivocada1');
    await page.getByTestId('btn-ingresar').click();

    await expect(page.getByTestId('mensaje-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('usuario-sesion')).toHaveCount(0);
  });

  test('sin sesión, una ruta protegida redirige al login', async ({ page }) => {
    await page.goto('/procesos');
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/usuarios');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('la sesión se conserva al recargar la página (refresh token)', async ({ page, api }) => {
    const empresa = await api.registrarEmpresa();
    await iniciarSesion(page, empresa.admin.email);

    // El access token vive solo en memoria: al recargar se pierde y se renueva con la cookie HttpOnly
    const renovacion = page.waitForResponse(r => r.url().includes('/sesiones/renovacion'));
    await page.reload();
    expect((await renovacion).status()).toBe(200);

    await expect(page).toHaveURL(/\/procesos$/);
    await expect(page.getByTestId('usuario-sesion')).toBeVisible();
  });

  test('el refresh token no es accesible desde JavaScript', async ({ page, api }) => {
    const empresa = await api.registrarEmpresa();
    await iniciarSesion(page, empresa.admin.email);

    const cookieVisible: string = await page.evaluate(() => document.cookie);
    expect(cookieVisible).not.toContain('bmpn_refresh');

    const cookies = await page.context().cookies();
    const refresh = cookies.find(c => c.name === 'bmpn_refresh');
    expect(refresh?.httpOnly).toBe(true);
    expect(refresh?.sameSite).toBe('Strict');
  });

  test('al salir se cierra la sesión y no se puede volver con recargar', async ({ page, api }) => {
    const empresa = await api.registrarEmpresa();
    await iniciarSesion(page, empresa.admin.email);

    await page.getByTestId('btn-salir').click();
    await expect(page).toHaveURL(/\/login$/);

    // El refresh token quedó revocado: recargar una ruta protegida vuelve al login
    await page.goto('/procesos');
    await expect(page).toHaveURL(/\/login$/);
  });
});
