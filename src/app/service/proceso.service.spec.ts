import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../config/api.config';
import { ErrorDto } from '../model/error-dto';
import { EstadoProceso, FiltroProceso } from '../model/proceso';
import { RolAcceso } from '../model/rol-acceso';
import { ProcesoService } from './proceso.service';
import { UsuarioActivoService } from './usuario-activo.service';

describe('ProcesoService', () => {
  let service: ProcesoService;
  let http: HttpTestingController;
  const url = `${API_URL}/procesos`;
  const filtroVacio: FiltroProceso = { nombre: '', estado: '', categoria: '', incluirInactivos: false, page: 0, size: 10 };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProcesoService);
    http = TestBed.inject(HttpTestingController);
    // Usuario con sesion iniciada: los servicios mandan su id en ?usuarioId=
    TestBed.inject(UsuarioActivoService).iniciarSesion({
      usuarioId: 7, empresaId: 1, email: 'ana@bitweb.co', nombreCompleto: 'Ana Prueba',
      rolAcceso: RolAcceso.ADMINISTRADOR, accessToken: 'token', tokenType: 'Bearer', expiresIn: 900
    });
  });

  afterEach(() => {
    http.verify();
    TestBed.inject(UsuarioActivoService).limpiar();
  });

  it('listar hace GET con el usuario, la página y el tamaño', () => {
    service.listar(filtroVacio).subscribe();

    const req = http.expectOne(r => r.url === url);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('usuarioId')).toBe('7');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.has('nombre')).toBe(false);
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 });
  });

  it('listar solo manda los filtros que tienen valor y sin espacios', () => {
    service.listar({ ...filtroVacio, nombre: '  vacaciones ', estado: EstadoProceso.PUBLICADO, page: 2 }).subscribe();

    const req = http.expectOne(r => r.url === url);
    expect(req.request.params.get('nombre')).toBe('vacaciones');
    expect(req.request.params.get('estado')).toBe('PUBLICADO');
    expect(req.request.params.has('categoria')).toBe(false);
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ content: [] });
  });

  it('crear hace POST con el cuerpo del formulario', () => {
    service.crear({ nombre: 'Compras', descripcion: 'Gestiona compras', categoria: 'Abastecimiento' }).subscribe();

    const req = http.expectOne(r => r.url === url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nombre: 'Compras', descripcion: 'Gestiona compras', categoria: 'Abastecimiento' });
    req.flush({ id: 1 });
  });

  it('editar hace PUT sobre /procesos/:id', () => {
    service.editar(4, { nombre: 'Compras', descripcion: 'x', categoria: 'y', estado: EstadoProceso.PUBLICADO }).subscribe();

    const req = http.expectOne(r => r.url === `${url}/4`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 4 });
  });

  it('eliminar hace DELETE sobre /procesos/:id', () => {
    service.eliminar(4).subscribe();

    const req = http.expectOne(r => r.url === `${url}/4`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('convierte el error del backend en un ErrorDto', () => {
    let error: ErrorDto | null = null;
    service.crear({ nombre: 'Compras', descripcion: 'x', categoria: 'y' }).subscribe({ error: (e: ErrorDto) => (error = e) });

    http.expectOne(r => r.url === url).flush(
      { codigo: 'RECURSO_DUPLICADO', mensaje: 'Ya existe un proceso con ese nombre en la empresa', fecha: '', detalles: [] },
      { status: 409, statusText: 'Conflict' }
    );
    expect(error!.mensaje).toBe('Ya existe un proceso con ese nombre en la empresa');
  });
});