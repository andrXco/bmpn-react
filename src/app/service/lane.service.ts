import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_URL } from '../config/api.config';
import { CrearLaneRequest, EditarLaneRequest, LaneResponse } from '../model/lane';
import { manejarError } from '../util/errores';
import { UsuarioActivoService } from './usuario-activo.service';

@Injectable({
  providedIn: 'root'
})
export class LaneService {
  constructor(
    private http: HttpClient,
    private usuarioActivo: UsuarioActivoService
  ) {}

  private urlBase(procesoId: number, poolId: number): string {
    return `${API_URL}/procesos/${procesoId}/pools/${poolId}/lanes`;
  }

  // POST /api/procesos/{procesoId}/pools/{poolId}/lanes?usuarioId=
  crear(procesoId: number, poolId: number, request: CrearLaneRequest): Observable<LaneResponse> {
    return this.http
      .post<LaneResponse>(this.urlBase(procesoId, poolId), request, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // PUT /api/procesos/{procesoId}/pools/{poolId}/lanes/{laneId}?usuarioId=
  editar(procesoId: number, poolId: number, laneId: number, request: EditarLaneRequest): Observable<LaneResponse> {
    return this.http
      .put<LaneResponse>(`${this.urlBase(procesoId, poolId)}/${laneId}`, request, {
        params: this.usuarioActivo.crearParametros()
      })
      .pipe(catchError(manejarError));
  }

  // DELETE /api/procesos/{procesoId}/pools/{poolId}/lanes/{laneId}?usuarioId=
  eliminar(procesoId: number, poolId: number, laneId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.urlBase(procesoId, poolId)}/${laneId}`, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // GET /api/procesos/{procesoId}/pools/{poolId}/lanes?usuarioId=
  listar(procesoId: number, poolId: number): Observable<LaneResponse[]> {
    return this.http
      .get<LaneResponse[]>(this.urlBase(procesoId, poolId), { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }
}
