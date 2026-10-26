import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_URL } from '../config/api.config';
import { AdvertenciasResponse } from '../model/diagrama';
import { CrearEventoRequest, EditarEventoRequest, EventoResponse } from '../model/evento';
import { manejarError } from '../util/errores';
import { UsuarioActivoService } from './usuario-activo.service';

@Injectable({
  providedIn: 'root'
})
export class EventoService {
  private readonly http = inject(HttpClient);
  private readonly usuarioActivo = inject(UsuarioActivoService);

  private urlBase(procesoId: number): string {
    return `${API_URL}/procesos/${procesoId}/eventos`;
  }

  // POST /api/procesos/{procesoId}/eventos?usuarioId=
  crear(procesoId: number, request: CrearEventoRequest): Observable<EventoResponse> {
    return this.http
      .post<EventoResponse>(this.urlBase(procesoId), request, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // GET /api/procesos/{procesoId}/eventos?usuarioId=
  listar(procesoId: number): Observable<EventoResponse[]> {
    return this.http
      .get<EventoResponse[]>(this.urlBase(procesoId), { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // GET /api/procesos/{procesoId}/eventos/{id}?usuarioId=
  obtener(procesoId: number, id: number): Observable<EventoResponse> {
    return this.http
      .get<EventoResponse>(`${this.urlBase(procesoId)}/${id}`, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // PUT /api/procesos/{procesoId}/eventos/{id}?usuarioId=
  editar(procesoId: number, id: number, request: EditarEventoRequest): Observable<EventoResponse> {
    return this.http
      .put<EventoResponse>(`${this.urlBase(procesoId)}/${id}`, request, {
        params: this.usuarioActivo.crearParametros()
      })
      .pipe(catchError(manejarError));
  }

  // DELETE /api/procesos/{procesoId}/eventos/{id}?usuarioId=
  eliminar(procesoId: number, id: number): Observable<AdvertenciasResponse> {
    return this.http
      .delete<AdvertenciasResponse>(`${this.urlBase(procesoId)}/${id}`, {
        params: this.usuarioActivo.crearParametros()
      })
      .pipe(catchError(manejarError));
  }
}
