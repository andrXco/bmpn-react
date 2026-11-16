import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ErrorDto } from '../../model/error-dto';
import { ProcesoService } from '../../service/proceso.service';
import { ProcesoFormComponent } from './proceso-form.component';

describe('ProcesoFormComponent', () => {
  let fixture: ComponentFixture<ProcesoFormComponent>;
  let element: HTMLElement;
  let service: { crear: ReturnType<typeof vi.fn>; editar: ReturnType<typeof vi.fn>; obtener: ReturnType<typeof vi.fn> };

  const escribir = (selector: string, valor: string) => {
    const input = element.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  };
  const enviar = async () => {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };
  const llenarFormulario = () => {
    escribir('#nombre', 'Compras');
    escribir('#descripcion', 'Gestiona las solicitudes de compra');
    escribir('#categoria', 'Abastecimiento');
  };

  beforeEach(async () => {
    service = { crear: vi.fn(), editar: vi.fn(), obtener: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ProcesoFormComponent],
      providers: [provideRouter([]), { provide: ProcesoService, useValue: service }]
    });
    fixture = TestBed.createComponent(ProcesoFormComponent);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('no envía el formulario vacío y muestra los errores', async () => {
    await enviar();

    expect(service.crear).not.toHaveBeenCalled();
    expect(element.textContent).toContain('El nombre es obligatorio');
    expect(element.textContent).toContain('La descripción es obligatoria');
    expect(element.textContent).toContain('La categoría es obligatoria');
  });

  it('sin id en la ruta crea el proceso y navega a su detalle', async () => {
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    service.crear.mockReturnValue(of({ id: 9 }));

    llenarFormulario();
    await enviar();

    // Al crear no se manda el estado: el backend siempre crea en BORRADOR
    expect(service.crear).toHaveBeenCalledWith({
      nombre: 'Compras', descripcion: 'Gestiona las solicitudes de compra', categoria: 'Abastecimiento'
    });
    expect(service.editar).not.toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith(['/procesos', 9]);
  });

  it('muestra el mensaje del backend si no se puede crear', async () => {
    const error: ErrorDto = {
      codigo: 'RECURSO_DUPLICADO', mensaje: 'Ya existe un proceso con ese nombre en la empresa', fecha: '', detalles: []
    };
    service.crear.mockReturnValue(throwError(() => error));

    llenarFormulario();
    await enviar();

    expect(element.textContent).toContain('Ya existe un proceso con ese nombre en la empresa');
  });
});