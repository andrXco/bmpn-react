import { HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

// El backend recibe el usuario que hace la petición en el parámetro ?usuarioId=
// Mientras no exista el módulo de autenticación, aquí se guarda el id del usuario activo.
@Injectable({
  providedIn: 'root'
})
export class UsuarioActivoService {
  private readonly clave: string = 'bpmn.usuarioId';
  // signal: la vista (navbar) se actualiza sola cuando cambia el id
  private id = signal<number | null>(null);

  constructor() {
    const guardado: string | null = localStorage.getItem(this.clave);
    if (guardado !== null) {
      const numero: number = Number(guardado);
      this.id.set(Number.isInteger(numero) && numero > 0 ? numero : null);
    }
  }

  get usuarioId(): number | null {
    return this.id();
  }

  establecer(id: number): void {
    this.id.set(id);
    localStorage.setItem(this.clave, id.toString());
  }

  limpiar(): void {
    this.id.set(null);
    localStorage.removeItem(this.clave);
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
