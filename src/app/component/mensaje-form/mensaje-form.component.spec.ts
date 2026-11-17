import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatosMensaje } from '../../model/mensaje';
import { MensajeFormComponent } from './mensaje-form.component';

describe('MensajeFormComponent', () => {
  let fixture: ComponentFixture<MensajeFormComponent>;
  let element: HTMLElement;
  let guardados: DatosMensaje[];

  const escribir = (selector: string, valor: string) => {
    const input = element.querySelector<HTMLInputElement>(selector)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  };
  const boton = (texto: string) =>
    Array.from(element.querySelectorAll('button')).find(b => b.textContent!.trim() === texto)!;
  const enviar = async () => {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };
  const agregarCampo = async (nombre: string) => {
    escribir('#nombreCampo', nombre);
    boton('Agregar').click();
    await fixture.whenStable();
  };

  const crear = async (notificacionExterna: boolean) => {
    fixture = TestBed.createComponent(MensajeFormComponent);
    fixture.componentRef.setInput('origen', 'Solicitud rechazada');
    fixture.componentRef.setInput('destino', 'Cliente Demo');
    fixture.componentRef.setInput('notificacionExterna', notificacionExterna);
    element = fixture.nativeElement;
    guardados = [];
    fixture.componentInstance.guardar.subscribe((datos: DatosMensaje) => guardados.push(datos));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [MensajeFormComponent] });
    await crear(false);
  });

  it('muestra el origen y el destino del mensaje', () => {
    expect(element.textContent).toContain('Nuevo mensaje');
    expect(element.textContent).toContain('Solicitud rechazada');
    expect(element.textContent).toContain('Cliente Demo');
  });

  it('no emite guardar con el formulario vacío y muestra los errores', async () => {
    await enviar();

    expect(guardados).toEqual([]);
    expect(element.textContent).toContain('El nombre es obligatorio');
    expect(element.textContent).toContain('La clave de correlación es obligatoria');
  });

  it('agrega campos al mensaje y no deja repetir el nombre', async () => {
    await agregarCampo('motivo');
    await agregarCampo('Motivo');

    expect(element.querySelectorAll('tbody tr').length).toBe(1);
    expect(element.textContent).toContain('El campo "Motivo" ya está en el mensaje.');
  });

  it('emite los datos sin espacios y con los campos agregados', async () => {
    escribir('#nombreMensaje', '  NotificarRechazo ');
    escribir('#claveCorrelacion', ' numeroSolicitud ');
    await agregarCampo('motivo');
    await enviar();

    expect(guardados.length).toBe(1);
    expect(guardados[0].nombre).toBe('NotificarRechazo');
    expect(guardados[0].claveCorrelacion).toBe('numeroSolicitud');
    expect(guardados[0].campos).toEqual([{ nombre: 'motivo', tipoDato: 'TEXTO', descripcion: null, obligatorio: false }]);
    // Solo una notificación a un sistema externo lleva política de fallo
    expect(guardados[0].politicaFallo).toBeNull();
  });

  it('pregunta qué hacer si falla solo cuando el destino es un sistema externo', async () => {
    expect(element.querySelector('#politicaFallo')).toBeNull();

    await crear(true);

    expect(element.textContent).toContain('Nueva notificación externa');
    expect(element.querySelector('#politicaFallo')).not.toBeNull();
  });

  it('el botón Cancelar emite cancelar', () => {
    let cancelado = false;
    fixture.componentInstance.cancelar.subscribe(() => (cancelado = true));

    boton('Cancelar').click();

    expect(cancelado).toBe(true);
  });
});