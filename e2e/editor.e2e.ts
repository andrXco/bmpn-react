import { Sesion, unico } from './support/api';
import {
  abrirDiagrama, conectar, elemento, esperarApi, expect, iniciarSesion, renombrar, soltarDesdePaleta, test
} from './support/fixtures';

// E2E-03 · Editor de procesos (bpmn-js): cada cambio en el diagrama se guarda en el backend
test.describe('Editor de diagramas', () => {
  let editor: Sesion;
  let procesoId: number;
  let laneId: number;

  // Proceso de la empresa con una lane vacía, listo para modelar
  test.beforeEach(async ({ api }) => {
    const empresa = await api.registrarEmpresa();
    editor = await api.registrarUsuario(empresa.admin, 'EDITOR');
    const proceso = await api.crearProceso(empresa.admin, `Compras ${unico()}`);
    procesoId = proceso.id;
    laneId = await api.crearLane(empresa.admin, proceso.id, proceso.poolId, 'Analista');
  });

  test('el editor abre el diagrama con la paleta de edición', async ({ page }) => {
    await iniciarSesion(page, editor.email);
    await page.getByTestId('fila-proceso').getByRole('link', { name: 'Ver' }).click();
    await page.getByTestId('btn-diagrama').click();

    await expect(page).toHaveURL(new RegExp(`/procesos/${procesoId}/diagrama$`));
    await expect(page.getByTestId('aviso-edicion')).toBeVisible();
    await expect(page.locator('.djs-palette')).toBeVisible();
    await expect(elemento(page, `Lane_${laneId}`)).toBeVisible();
  });

  test('una tarea arrastrada desde la paleta se guarda como actividad', async ({ page, api }) => {
    await iniciarSesion(page, editor.email);
    await abrirDiagrama(page, procesoId);

    const guardado = esperarApi(page, 'POST', new RegExp(`/procesos/${procesoId}/actividades`));
    await soltarDesdePaleta(page, 'create.task', elemento(page, `Lane_${laneId}`));
    const respuesta = await guardado;
    expect(respuesta.status()).toBe(201);
    const creada = await respuesta.json();

    // La forma toma el id del backend y la actividad queda en la lane donde se soltó
    await expect(elemento(page, `Actividad_${creada.id}`)).toBeVisible();
    expect(creada.laneId).toBe(laneId);
    expect(creada.nombre).toBe('Nueva actividad 1');

    // Sigue ahí después de recargar el diagrama desde el backend
    await page.getByTestId('btn-recargar').click();
    await expect(elemento(page, `Actividad_${creada.id}`)).toBeVisible();
    const actividades = await api.actividades(editor, procesoId);
    expect(actividades).toHaveLength(1);
  });

  test('renombrar una actividad con doble clic actualiza el backend', async ({ page, api }) => {
    const actividadId: number = await api.crearActividad(editor, procesoId, laneId, 'Revisar', 120);
    await iniciarSesion(page, editor.email);
    await abrirDiagrama(page, procesoId);

    const guardado = esperarApi(page, 'PUT', new RegExp(`/actividades/${actividadId}`));
    await renombrar(page, elemento(page, `Actividad_${actividadId}`), 'Revisar solicitud de compra');
    expect((await guardado).status()).toBe(200);

    const actividades = await api.actividades(editor, procesoId);
    expect(actividades[0].nombre).toBe('Revisar solicitud de compra');
  });

  test('unir dos actividades con una flecha crea el arco', async ({ page, api }) => {
    const origen: number = await api.crearActividad(editor, procesoId, laneId, 'Revisar', 120);
    const destino: number = await api.crearActividad(editor, procesoId, laneId, 'Aprobar', 420);
    await iniciarSesion(page, editor.email);
    await abrirDiagrama(page, procesoId);

    const guardado = esperarApi(page, 'POST', new RegExp(`/procesos/${procesoId}/arcos`));
    await conectar(page, elemento(page, `Actividad_${origen}`), elemento(page, `Actividad_${destino}`));
    const respuesta = await guardado;
    expect(respuesta.status()).toBe(201);
    const arco = await respuesta.json();

    await expect(elemento(page, `Arco_${arco.id}`)).toBeVisible();
    const arcos = await api.arcos(editor, procesoId);
    expect(arcos).toEqual([expect.objectContaining({ origenId: origen, destinoId: destino })]);
  });

  test('el editor no tiene la opción de eliminar: solo el administrador', async ({ page, api }) => {
    const actividadId: number = await api.crearActividad(editor, procesoId, laneId, 'Revisar', 120);
    await iniciarSesion(page, editor.email);
    await abrirDiagrama(page, procesoId);

    await expect(page.getByTestId('aviso-edicion')).toContainText('Solo el administrador puede eliminar elementos');
    await elemento(page, `Actividad_${actividadId}`).click();

    // El menú de la actividad sigue ofreciendo conectar, pero no borrar
    await expect(page.locator('.djs-context-pad .entry[data-action="connect"]')).toBeVisible();
    await expect(page.locator('.djs-context-pad .entry[data-action="delete"]')).toHaveCount(0);

    // Con la tecla Supr tampoco se borra
    await page.keyboard.press('Delete');
    await expect(elemento(page, `Actividad_${actividadId}`)).toBeVisible();
    expect(await api.actividades(editor, procesoId)).toHaveLength(1);
  });
});
