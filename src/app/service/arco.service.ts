import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_URL } from '../config/api.config';
import { AdvertenciasResponse } from '../model/advertencias';
import { ArcoRequest, ArcoResponse } from '../model/arco';
import { manejarError } from '../util/errores';
import { UsuarioActivoService } from './usuario-activo.service';

@Injectable({
  providedIn: 'root'
})
export class ArcoService {
  constructor(
    private http: HttpClient,
    private usuarioActivo: UsuarioActivoService
  ) {}

  private urlBase(procesoId: number): string {
    return `${API_URL}/procesos/${procesoId}/arcos`;
  }

  // POST /api/procesos/{procesoId}/arcos?usuarioId=
  crear(procesoId: number, request: ArcoRequest): Observable<ArcoResponse> {
    return this.http
      .post<ArcoResponse>(this.urlBase(procesoId), request, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // PUT /api/procesos/{procesoId}/arcos/{id}?usuarioId=
  editar(procesoId: number, id: number, request: ArcoRequest): Observable<ArcoResponse> {
    return this.http
      .put<ArcoResponse>(`${this.urlBase(procesoId)}/${id}`, request, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // DELETE /api/procesos/{procesoId}/arcos/{id}?usuarioId=
  eliminar(procesoId: number, id: number): Observable<AdvertenciasResponse> {
    return this.http
      .delete<AdvertenciasResponse>(`${this.urlBase(procesoId)}/${id}`, {
        params: this.usuarioActivo.crearParametros()
      })
      .pipe(catchError(manejarError));
  }

  // GET /api/procesos/{procesoId}/arcos?usuarioId=
  listar(procesoId: number): Observable<ArcoResponse[]> {
    return this.http
      .get<ArcoResponse[]>(this.urlBase(procesoId), { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }
}
