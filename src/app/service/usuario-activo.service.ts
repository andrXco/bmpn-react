import { HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { RolAcceso } from '../model/rol-acceso';
import { DatosSesionUsuario, SesionUsuarioResponse } from '../model/sesion';

// Conserva los datos visibles del usuario y el access token solo en memoria.
// El backend identifica la sesión con el JWT; usuarioId se conserva como contexto
// de compatibilidad y el servidor verifica que coincida con el token.
@Injectable({
  providedIn: 'root'
})
export class UsuarioActivoService {
  private readonly clave: string = 'bpmn.usuarioId';
  private readonly claveSesion: string = 'bpmn.sesion';
  private id = signal<number | null>(null);
  private token = signal<string | null>(null);
  private datosSesion = signal<DatosSesionUsuario | null>(null);

  constructor() {
    const guardado: string | null = localStorage.getItem(this.clave);
    if (guardado !== null) {
      const numero: number = Number(guardado);
      this.id.set(Number.isInteger(numero) && numero > 0 ? numero : null);
    }

    const sesionGuardada: string | null = localStorage.getItem(this.claveSesion);
    if (sesionGuardada !== null && this.id() !== null) {
      try {
        const sesion: DatosSesionUsuario = JSON.parse(sesionGuardada) as DatosSesionUsuario;
        if (sesion.usuarioId === this.id()) {
          this.datosSesion.set(sesion);
        }
      } catch {
        localStorage.removeItem(this.claveSesion);
      }
    }
  }

  get usuarioId(): number | null {
    return this.id();
  }

  get sesion(): DatosSesionUsuario | null {
    return this.datosSesion();
  }

  get accessToken(): string | null {
    return this.token();
  }

  // El módulo de usuarios es solo para administradores; si no se conoce el rol, el backend decide
  get puedeAdministrarUsuarios(): boolean {
    const sesion: DatosSesionUsuario | null = this.datosSesion();
    return sesion === null || sesion.rolAcceso === RolAcceso.ADMINISTRADOR;
  }

  // Resultado de POST /api/sesiones
  iniciarSesion(sesion: SesionUsuarioResponse): void {
    this.id.set(sesion.usuarioId);
    this.token.set(sesion.accessToken);
    const datosSesion: DatosSesionUsuario = {
      usuarioId: sesion.usuarioId,
      empresaId: sesion.empresaId,
      email: sesion.email,
      nombreCompleto: sesion.nombreCompleto,
      rolAcceso: sesion.rolAcceso
    };
    this.datosSesion.set(datosSesion);
    localStorage.setItem(this.clave, sesion.usuarioId.toString());
    localStorage.setItem(this.claveSesion, JSON.stringify(datosSesion));
  }

  limpiar(): void {
    this.id.set(null);
    this.token.set(null);
    this.datosSesion.set(null);
    localStorage.removeItem(this.clave);
    localStorage.removeItem(this.claveSesion);
  }

  // Compatibilidad con las rutas actuales; el backend contrasta el id con el JWT.
  crearParametros(): HttpParams {
    let params: HttpParams = new HttpParams();
    const actual: number | null = this.id();
    if (actual !== null) {
      params = params.set('usuarioId', actual.toString());
    }
    return params;
  }
}
