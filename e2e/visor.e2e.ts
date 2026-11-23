import { Empresa, Sesion, unico } from './support/api';
import { abrirDiagrama, elemento, expect, iniciarSesion, test } from './support/fixtures';

// E2E-04 · Visor de procesos: rol de solo lectura y procesos compartidos entre empresas (HU-23 y HU-24)
test.describe('Visor de diagramas', () => {
  let empresaA: Empresa;
  let lector: Sesion;
  let procesoId: number;
  let nombreProceso: string;
  let revisar: number;
  let aprobar: number;

  // Proceso de la empresa A con dos actividades ya modeladas
  test.beforeEach(async ({ api }) => {
    empresaA = await api.registrarEmpresa('A');
    lector = await api.registrarUsuario(empresaA.admin, 'SOLO_LECTURA');
    nombreProceso = `Vacaciones ${unico()}`;
    const proceso = await api.crearProceso(empresaA.admin, nombreProceso);
    procesoId = proceso.id;
    const laneId: number = await api.crearLane(empresaA.admin, proceso.id, proceso.poolId, 'Empleado');
    revisar = await api.crearActividad(empresaA.admin, procesoId, laneId, 'Solicitar vacaciones', 120);
    aprobar = await api.crearActividad(empresaA.admin, procesoId, laneId, 'Aprobar solicitud', 420);
  });

  test('el lector ve el diagrama completo sin herramientas de edición', async ({ page }) => {
    await iniciarSesion(page, lector.email);
    await abrirDiagrama(page, procesoId);

    await expect(page.getByTestId('aviso-solo-lectura')).toBeVisible();
    await expect(elemento(page, `Actividad_${revisar}`)).toBeVisible();
    await expect(elemento(page, `Actividad_${aprobar}`)).toBeVisible();
    await expect(page.locator('.djs-palette')).toHaveCount(0);
  });

  test('el lector consulta el detalle de un elemento pero no puede editarlo', async ({ page }) => {
    await iniciarSesion(page, lector.email);
    await abrirDiagrama(page, procesoId);

    await elemento(page, `Actividad_${revisar}`).click();
    const detalle = page.getByTestId('detalle-elemento');
    await expect(detalle).toBeVisible();
    await expect(detalle).toContainText('Solicitar vacaciones');
    await expect(page.locator('.djs-context-pad .entry')).toHaveCount(0);

    // El doble clic no abre la edición del nombre
    await elemento(page, `Actividad_${revisar}`).dblclick();
    await expect(page.locator('.djs-direct-editing-parent')).toBeHidden();
  });

  test('si el lector intenta editar el proceso, el backend lo rechaza', async ({ page, api }) => {
    await iniciarSesion(page, lector.email);
    await page.goto(`/procesos/${procesoId}/editar`);
    await expect(page.locator('#nombre')).toHaveValue(nombreProceso);

    await page.locator('#nombre').fill('Cambiado por el lector');
    const intento = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().includes(`/procesos/${procesoId}`));
    await page.getByTestId('btn-guardar-proceso').click();
    expect((await intento).status()).toBe(403);

    await expect(page.getByTestId('mensaje-error')).toBeVisible();
    const procesos = await api.procesos(lector);
    expect(procesos.find(p => p.id === procesoId)?.nombre).toBe(nombreProceso);
  });

  test('la empresa invitada ve el proceso compartido en solo lectura', async ({ page, api }) => {
    const empresaB: Empresa = await api.registrarEmpresa('B');
    await api.compartir(empresaA.admin, procesoId, empresaB.admin);

    await iniciarSesion(page, empresaB.admin.email);
    const fila = page.getByTestId('fila-proceso').filter({ hasText: nombreProceso });
    await expect(fila.getByTestId('badge-compartido')).toBeVisible();

    await fila.getByRole('link', { name: 'Ver' }).click();
    await page.getByTestId('btn-diagrama').click();

    await expect(page.getByTestId('aviso-compartido')).toBeVisible();
    await expect(elemento(page, `Actividad_${revisar}`)).toBeVisible();
    await expect(page.locator('.djs-palette')).toHaveCount(0);
  });

  test('una empresa sin invitación no puede abrir el diagrama', async ({ page, api }) => {
    const empresaC: Empresa = await api.registrarEmpresa('C');

    await iniciarSesion(page, empresaC.admin.email);
    await page.goto(`/procesos/${procesoId}/diagrama`);

    await expect(page.getByTestId('mensaje-error')).toBeVisible();
    await expect(page.locator('.djs-element[data-element-id^="Actividad_"]')).toHaveCount(0);
  });
});
