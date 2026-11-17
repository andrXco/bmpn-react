import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../config/api.config';
import { RolAcceso } from '../model/rol-acceso';
import { SesionUsuarioResponse } from '../model/sesion';
import { AutenticacionService } from './autenticacion.service';
import { UsuarioActivoService } from './usuario-activo.service';

describe('AutenticacionService', () => {
  let service: AutenticacionService;
  let usuarioActivo: UsuarioActivoService;
  let http: HttpTestingController;
  const url = `${API_URL}/sesiones`;
  const sesion: SesionUsuarioResponse = {
    usuarioId: 7, empresaId: 1, email: 'ana@bitweb.co', nombreCompleto: 'Ana Prueba',
    rolAcceso: RolAcceso.EDITOR, accessToken: 'token-nuevo', tokenType: 'Bearer', expiresIn: 900
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AutenticacionService);
    usuarioActivo = TestBed.inject(UsuarioActivoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    usuarioActivo.limpiar();
  });

  it('iniciarSesion hace POST con las credenciales y permite la cookie de renovación', () => {
    service.iniciarSesion({ email: 'ana@bitweb.co', password: 'BitWeb2026' }).subscribe();

    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'ana@bitweb.co', password: 'BitWeb2026' });
    expect(req.request.withCredentials).toBe(true);
    req.flush(sesion);
  });

  it('renovarSesion guarda el token nuevo en memoria', () => {
    service.renovarSesion().subscribe();

    const req = http.expectOne(`${url}/renovacion`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush(sesion);
    expect(usuarioActivo.accessToken).toBe('token-nuevo');
    expect(usuarioActivo.usuarioId).toBe(7);
  });

  it('dos renovaciones al mismo tiempo comparten una sola petición', () => {
    service.renovarSesion().subscribe();
    service.renovarSesion().subscribe();

    // expectOne falla si salieron dos peticiones
    http.expectOne(`${url}/renovacion`).flush(sesion);
  });

  it('restaurarSesion limpia la sesión si la renovación falla', () => {
    usuarioActivo.iniciarSesion(sesion);
    let termino = false;
    service.restaurarSesion().subscribe({ complete: () => (termino = true) });

    http.expectOne(`${url}/renovacion`).flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(termino).toBe(true);
    expect(usuarioActivo.usuarioId).toBeNull();
    expect(usuarioActivo.accessToken).toBeNull();
  });

  it('cerrarSesion hace DELETE para que el backend invalide la cookie', () => {
    service.cerrarSesion().subscribe();

    const req = http.expectOne(url);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.withCredentials).toBe(true);
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});