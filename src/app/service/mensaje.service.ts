import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_URL } from '../config/api.config';
import { CrearMensajeRequest, MensajeResponse } from '../model/mensaje';
import { manejarError } from '../util/errores';
import { UsuarioActivoService } from './usuario-activo.service';

@Injectable({
  providedIn: 'root'
})
export class MensajeService {
  constructor(
    private http: HttpClient,
    private usuarioActivo: UsuarioActivoService
  ) {}

  private urlBase(procesoId: number): string {
    return `${API_URL}/procesos/${procesoId}/mensajes`;
  }

  // POST /api/procesos/{procesoId}/mensajes?usuarioId=
  crear(procesoId: number, request: CrearMensajeRequest): Observable<MensajeResponse> {
    return this.http
      .post<MensajeResponse>(this.urlBase(procesoId), request, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // DELETE /api/procesos/{procesoId}/mensajes/{id}?usuarioId=
  eliminar(procesoId: number, id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.urlBase(procesoId)}/${id}`, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // GET /api/procesos/{procesoId}/mensajes?usuarioId=
  listar(procesoId: number): Observable<MensajeResponse[]> {
    return this.http
      .get<MensajeResponse[]>(this.urlBase(procesoId), { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // GET /api/procesos/{procesoId}/mensajes/correlacion/{clave}?usuarioId=
  listarPorCorrelacion(procesoId: number, clave: string): Observable<MensajeResponse[]> {
    return this.http
      .get<MensajeResponse[]>(`${this.urlBase(procesoId)}/correlacion/${encodeURIComponent(clave)}`, {
        params: this.usuarioActivo.crearParametros()
      })
      .pipe(catchError(manejarError));
  }
}
