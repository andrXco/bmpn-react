import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_URL } from '../config/api.config';
import { CrearPoolRequest, EditarPoolRequest, PoolResponse } from '../model/pool';
import { manejarError } from '../util/errores';
import { UsuarioActivoService } from './usuario-activo.service';

@Injectable({
  providedIn: 'root'
})
export class PoolService {
  constructor(
    private http: HttpClient,
    private usuarioActivo: UsuarioActivoService
  ) {}

  private urlBase(procesoId: number): string {
    return `${API_URL}/procesos/${procesoId}/pools`;
  }

  // POST /api/procesos/{procesoId}/pools?usuarioId=
  crear(procesoId: number, request: CrearPoolRequest): Observable<PoolResponse> {
    return this.http
      .post<PoolResponse>(this.urlBase(procesoId), request, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // PUT /api/procesos/{procesoId}/pools/{poolId}?usuarioId=
  editar(procesoId: number, poolId: number, request: EditarPoolRequest): Observable<PoolResponse> {
    return this.http
      .put<PoolResponse>(`${this.urlBase(procesoId)}/${poolId}`, request, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // DELETE /api/procesos/{procesoId}/pools/{poolId}?usuarioId=
  eliminar(procesoId: number, poolId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.urlBase(procesoId)}/${poolId}`, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // GET /api/procesos/{procesoId}/pools?usuarioId=
  listar(procesoId: number): Observable<PoolResponse[]> {
    return this.http
      .get<PoolResponse[]>(this.urlBase(procesoId), { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // GET /api/procesos/{procesoId}/pools/{poolId}?usuarioId=
  obtener(procesoId: number, poolId: number): Observable<PoolResponse> {
    return this.http
      .get<PoolResponse>(`${this.urlBase(procesoId)}/${poolId}`, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }
}
