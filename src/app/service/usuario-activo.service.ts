import { HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { RolAcceso } from '../model/rol-acceso';
import { SesionUsuarioResponse } from '../model/sesion';

// El backend recibe el usuario que hace la petición en el parámetro ?usuarioId=
// Aquí se guarda el usuario activo: lo establece el inicio de sesión (POST /api/sesiones)
// o, al registrar una empresa, el administrador recién creado.
@Injectable({
  providedIn: 'root'
})
export class UsuarioActivoService {
  private readonly clave: string = 'bpmn.usuarioId';
  private readonly claveSesion: string = 'bpmn.sesion';
  // signal: la vista (navbar) se actualiza sola cuando cambia el id
  private id = signal<number | null>(null);
  // Datos de la sesión (nombre, rol...). Es null si solo se conoce el id (p. ej. tras registrar una empresa)
  private datosSesion = signal<SesionUsuarioResponse | null>(null);

  constructor() {
    const guardado: string | null = localStorage.getItem(this.clave);
    if (guardado !== null) {
      const numero: number = Number(guardado);
      this.id.set(Number.isInteger(numero) && numero > 0 ? numero : null);
    }

    const sesionGuardada: string | null = localStorage.getItem(this.claveSesion);
    if (sesionGuardada !== null && this.id() !== null) {
      try {
        const sesion: SesionUsuarioResponse = JSON.parse(sesionGuardada) as SesionUsuarioResponse;
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

  get sesion(): SesionUsuarioResponse | null {
    return this.datosSesion();
  }

  // El módulo de usuarios es solo para administradores; si no se conoce el rol, el backend decide
  get puedeAdministrarUsuarios(): boolean {
    const sesion: SesionUsuarioResponse | null = this.datosSesion();
    return sesion === null || sesion.rolAcceso === RolAcceso.ADMINISTRADOR;
  }

  // Resultado de POST /api/sesiones
  iniciarSesion(sesion: SesionUsuarioResponse): void {
    this.id.set(sesion.usuarioId);
    this.datosSesion.set(sesion);
    localStorage.setItem(this.clave, sesion.usuarioId.toString());
    localStorage.setItem(this.claveSesion, JSON.stringify(sesion));
  }

  // Solo se conoce el id (sin datos de sesión)
  establecer(id: number): void {
    this.id.set(id);
    this.datosSesion.set(null);
    localStorage.setItem(this.clave, id.toString());
    localStorage.removeItem(this.claveSesion);
  }

  limpiar(): void {
    this.id.set(null);
    this.datosSesion.set(null);
    localStorage.removeItem(this.clave);
    localStorage.removeItem(this.claveSesion);
  }

  // Parámetros base de casi todas las peticiones: ?usuarioId=...
  crearParametros(): HttpParams {
    let params: HttpParams = new HttpParams();
    const actual: number | null = this.id();
    if (actual !== null) {
      params = params.set('usuarioId', actual.toString());
    }
    return params;
  }
}
