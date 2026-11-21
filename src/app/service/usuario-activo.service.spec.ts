import { TestBed } from '@angular/core/testing';
import { RolAcceso } from '../model/rol-acceso';
import { SesionUsuarioResponse } from '../model/sesion';
import { UsuarioActivoService } from './usuario-activo.service';

describe('UsuarioActivoService', () => {
  let service: UsuarioActivoService;
  const sesion: SesionUsuarioResponse = {
    usuarioId: 7, empresaId: 1, email: 'ana@bitweb.co', nombreCompleto: 'Ana Prueba',
    rolAcceso: RolAcceso.EDITOR, accessToken: 'token', tokenType: 'Bearer', expiresIn: 900
  };

  beforeEach(() => {
    service = TestBed.inject(UsuarioActivoService);
  });

  afterEach(() => {
    service.limpiar();
  });

  it('reconoce un proceso de la empresa del usuario', () => {
    service.iniciarSesion(sesion);

    expect(service.esDeMiEmpresa(1)).toBe(true);
  });

  it('trata como compartido un proceso de otra empresa', () => {
    service.iniciarSesion(sesion);

    expect(service.esDeMiEmpresa(2)).toBe(false);
  });

  it('sin datos de sesión deja que el backend decida', () => {
    expect(service.esDeMiEmpresa(2)).toBe(true);
  });
});
