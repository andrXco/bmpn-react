import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_URL } from '../config/api.config';
import { CompartirProcesoRequest, ProcesoCompartidoResponse } from '../model/proceso-compartido';
import { manejarError } from '../util/errores';
import { UsuarioActivoService } from './usuario-activo.service';

@Injectable({
  providedIn: 'root'
})
export class ProcesoCompartidoService {
  constructor(
    private http: HttpClient,
    private usuarioActivo: UsuarioActivoService
  ) {}

  private urlBase(procesoId: number): string {
    return `${API_URL}/procesos/${procesoId}/compartidos`;
  }

  // GET /api/procesos/{procesoId}/compartidos?usuarioId=
  listar(procesoId: number): Observable<ProcesoCompartidoResponse[]> {
    return this.http
      .get<ProcesoCompartidoResponse[]>(this.urlBase(procesoId), { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // POST /api/procesos/{procesoId}/compartidos?usuarioId=
  compartir(procesoId: number, request: CompartirProcesoRequest): Observable<ProcesoCompartidoResponse> {
    return this.http
      .post<ProcesoCompartidoResponse>(this.urlBase(procesoId), request, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // DELETE /api/procesos/{procesoId}/compartidos/{compartidoId}?usuarioId=
  revocar(procesoId: number, compartidoId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.urlBase(procesoId)}/${compartidoId}`, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }
}
