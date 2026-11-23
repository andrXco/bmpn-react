import { unico } from './support/api';
import { expect, iniciarSesion, test } from './support/fixtures';

// E2E-02 · Gestión de procesos y control de acceso en la interfaz
test.describe('Procesos', () => {

  test('el editor crea un proceso desde el formulario y aparece en el listado', async ({ page, api }) => {
    const empresa = await api.registrarEmpresa();
    const editor = await api.registrarUsuario(empresa.admin, 'EDITOR');
    const nombre: string = `Compras ${unico()}`;

    await iniciarSesion(page, editor.email);
    await page.getByRole('link', { name: 'Nuevo proceso' }).click();
    await page.locator('#nombre').fill(nombre);
    await page.locator('#descripcion').fill('Solicitud y aprobación de compras');
    await page.locator('#categoria').fill('Finanzas');
    await page.getByTestId('btn-guardar-proceso').click();

    await expect(page.getByTestId('titulo-proceso')).toHaveText(nombre);
    await page.getByRole('link', { name: 'Volver' }).click();
    await expect(page.getByTestId('fila-proceso').filter({ hasText: nombre })).toBeVisible();

    // Quedó guardado en el backend
    const procesos = await api.procesos(editor);
    expect(procesos.map(p => p.nombre)).toContain(nombre);
  });

  test('el formulario no se envía con campos obligatorios vacíos', async ({ page, api }) => {
    const empresa = await api.registrarEmpresa();
    await iniciarSesion(page, empresa.admin.email);

    await page.goto('/procesos/nuevo');
    const creacion = page.waitForRequest(r => r.method() === 'POST' && r.url().includes('/api/procesos'),
      { timeout: 2_000 }).catch(() => null);
    await page.getByTestId('btn-guardar-proceso').click();

    expect(await creacion).toBeNull();
    await expect(page).toHaveURL(/\/procesos\/nuevo$/);
  });

  test('cada empresa ve solo sus procesos', async ({ page, api }) => {
    const empresaA = await api.registrarEmpresa('A');
    const empresaB = await api.registrarEmpresa('B');
    const nombreA: string = `Proceso privado de A ${unico()}`;
    await api.crearProceso(empresaA.admin, nombreA);

    await iniciarSesion(page, empresaB.admin.email);
    await expect(page.getByText('No hay procesos para mostrar.')).toBeVisible();
    await expect(page.getByText(nombreA)).toHaveCount(0);
  });

  test('otra empresa no puede abrir un proceso ajeno escribiendo la URL', async ({ page, api }) => {
    const empresaA = await api.registrarEmpresa('A');
    const empresaB = await api.registrarEmpresa('B');
    const proceso = await api.crearProceso(empresaA.admin, `Nómina ${unico()}`);

    await iniciarSesion(page, empresaB.admin.email);
    await page.goto(`/procesos/${proceso.id}`);

    await expect(page.getByTestId('mensaje-error')).toBeVisible();
    await expect(page.getByTestId('titulo-proceso')).toHaveCount(0);
  });

  test('solo el administrador ve el módulo de usuarios', async ({ page, api }) => {
    const empresa = await api.registrarEmpresa();
    const lector = await api.registrarUsuario(empresa.admin, 'SOLO_LECTURA');

    await iniciarSesion(page, empresa.admin.email);
    await expect(page.getByTestId('nav-usuarios')).toBeVisible();
    await page.getByTestId('btn-salir').click();

    await iniciarSesion(page, lector.email);
    await expect(page.getByTestId('nav-usuarios')).toHaveCount(0);
  });
});
