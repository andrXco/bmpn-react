import { Locator, Page, Response, expect, test as base } from '@playwright/test';
import { ApiBmpn, CLAVE } from './api';

// Fixture "api": cliente para preparar datos, se crea y se cierra en cada prueba
export const test = base.extend<{ api: ApiBmpn }>({
  api: async ({}, use) => {
    const api: ApiBmpn = await ApiBmpn.crear();
    await use(api);
    await api.cerrar();
  }
});

export { expect };

// ---- Acciones de la interfaz ----

export async function iniciarSesion(page: Page, email: string, password: string = CLAVE): Promise<void> {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByTestId('btn-ingresar').click();
  await expect(page).toHaveURL(/\/procesos$/);
  await expect(page.getByTestId('usuario-sesion')).toBeVisible();
}

// Abre el diagrama y espera a que bpmn-js termine de dibujarlo
export async function abrirDiagrama(page: Page, procesoId: number): Promise<Locator> {
  await page.goto(`/procesos/${procesoId}/diagrama`);
  const lienzo: Locator = page.getByTestId('lienzo-diagrama');
  await expect(lienzo.locator('.djs-container')).toBeVisible();
  await expect(page.getByText('Cargando...')).toHaveCount(0);
  return lienzo;
}

// Forma de bpmn-js por su id de dominio: Lane_5, Actividad_12, Arco_3...
export function elemento(page: Page, bpmnId: string): Locator {
  return page.locator(`.djs-element[data-element-id="${bpmnId}"]`);
}

// Espera la respuesta del backend que provoca una acción en el diagrama
export function esperarApi(page: Page, metodo: string, ruta: RegExp): Promise<Response> {
  return page.waitForResponse(r => r.request().method() === metodo && ruta.test(r.url()));
}

// Toma un elemento de la paleta y lo suelta en un punto relativo de otra forma (por ejemplo, una lane)
export async function soltarDesdePaleta(page: Page, accion: string, destino: Locator,
                                        relX: number = 0.7, relY: number = 0.5): Promise<void> {
  const caja = await destino.boundingBox();
  if (!caja) {
    throw new Error('El destino no está visible en el lienzo');
  }
  const x: number = caja.x + caja.width * relX;
  const y: number = caja.y + caja.height * relY;
  await page.locator(`.djs-palette .entry[data-action="${accion}"]`).click();
  await page.mouse.move(x - 20, y - 20);
  await page.mouse.move(x, y, { steps: 10 });
  await page.mouse.click(x, y);
}

// Une dos formas con la flecha del menú contextual de bpmn-js
export async function conectar(page: Page, origen: Locator, destino: Locator): Promise<void> {
  await origen.click();
  await page.locator('.djs-context-pad .entry[data-action="connect"]').click();
  const caja = await destino.boundingBox();
  if (!caja) {
    throw new Error('El destino no está visible en el lienzo');
  }
  const x: number = caja.x + caja.width / 2;
  const y: number = caja.y + caja.height / 2;
  await page.mouse.move(x - 30, y, { steps: 5 });
  await page.mouse.move(x, y, { steps: 10 });
  await page.mouse.click(x, y);
}

// Cambia el nombre de una forma con doble clic (edición directa de bpmn-js)
export async function renombrar(page: Page, forma: Locator, nombre: string): Promise<void> {
  await forma.dblclick();
  const editor: Locator = page.locator('.djs-direct-editing-parent');
  await expect(editor).toBeVisible();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type(nombre);
  // Al hacer clic fuera de la forma se confirma el nombre
  const lienzo = await page.getByTestId('lienzo-diagrama').boundingBox();
  await page.mouse.click(lienzo!.x + lienzo!.width - 15, lienzo!.y + lienzo!.height - 15);
  await expect(editor).toBeHidden();
}
