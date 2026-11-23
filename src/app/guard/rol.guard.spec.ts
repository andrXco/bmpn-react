import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { RolAcceso } from '../model/rol-acceso';
import { SesionUsuarioResponse } from '../model/sesion';
import { UsuarioActivoService } from '../service/usuario-activo.service';
import { administradorGuard, puedeEditarGuard } from './rol.guard';

describe('Guards por rol', () => {
  let usuarioActivo: UsuarioActivoService;
  let router: Router;
  const ruta = {} as ActivatedRouteSnapshot;
  const estado = {} as RouterStateSnapshot;

  function iniciarComo(rolAcceso: RolAcceso): void {
    const sesion: SesionUsuarioResponse = {
      usuarioId: 7, empresaId: 1, email: 'ana@bitweb.co', nombreCompleto: 'Ana Prueba',
      rolAcceso, accessToken: 'token', tokenType: 'Bearer', expiresIn: 900
    };
    usuarioActivo.iniciarSesion(sesion);
  }

  function ejecutar(guard: typeof puedeEditarGuard): boolean | UrlTree {
    return TestBed.runInInjectionContext(() => guard(ruta, estado)) as boolean | UrlTree;
  }

  beforeEach(() => {
    usuarioActivo = TestBed.inject(UsuarioActivoService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    usuarioActivo.limpiar();
  });

  it('el lector no entra a crear o editar y vuelve a procesos', () => {
    iniciarComo(RolAcceso.SOLO_LECTURA);

    const resultado = ejecutar(puedeEditarGuard);

    expect(router.serializeUrl(resultado as UrlTree)).toBe('/procesos');
  });

  it('el editor entra a crear o editar', () => {
    iniciarComo(RolAcceso.EDITOR);

    expect(ejecutar(puedeEditarGuard)).toBe(true);
  });

  it('el editor no entra a las pantallas del administrador', () => {
    iniciarComo(RolAcceso.EDITOR);

    const resultado = ejecutar(administradorGuard);

    expect(router.serializeUrl(resultado as UrlTree)).toBe('/procesos');
  });

  it('el administrador entra a sus pantallas', () => {
    iniciarComo(RolAcceso.ADMINISTRADOR);

    expect(ejecutar(administradorGuard)).toBe(true);
  });
});