import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_URL } from '../config/api.config';
import { ActividadResponse, CrearActividadRequest, EditarActividadRequest } from '../model/actividad';
import { manejarError } from '../util/errores';
import { UsuarioActivoService } from './usuario-activo.service';

@Injectable({
  providedIn: 'root'
})
export class ActividadService {
  private readonly http = inject(HttpClient);
  private readonly usuarioActivo = inject(UsuarioActivoService);

  private urlBase(procesoId: number): string {
    return `${API_URL}/procesos/${procesoId}/actividades`;
  }

  // POST /api/procesos/{procesoId}/actividades?usuarioId=
  crear(procesoId: number, request: CrearActividadRequest): Observable<ActividadResponse> {
    return this.http
      .post<ActividadResponse>(this.urlBase(procesoId), request, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // GET /api/procesos/{procesoId}/actividades?usuarioId=
  listar(procesoId: number): Observable<ActividadResponse[]> {
    return this.http
      .get<ActividadResponse[]>(this.urlBase(procesoId), { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // GET /api/procesos/{procesoId}/actividades/{id}?usuarioId=
  obtener(procesoId: number, id: number): Observable<ActividadResponse> {
    return this.http
      .get<ActividadResponse>(`${this.urlBase(procesoId)}/${id}`, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // PUT /api/procesos/{procesoId}/actividades/{id}?usuarioId=
  editar(procesoId: number, id: number, request: EditarActividadRequest): Observable<ActividadResponse> {
    return this.http
      .put<ActividadResponse>(`${this.urlBase(procesoId)}/${id}`, request, {
        params: this.usuarioActivo.crearParametros()
      })
      .pipe(catchError(manejarError));
  }

  // DELETE /api/procesos/{procesoId}/actividades/{id}?usuarioId=
  eliminar(procesoId: number, id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.urlBase(procesoId)}/${id}`, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }
}
