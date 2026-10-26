import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_URL } from '../config/api.config';
import { AdvertenciasResponse } from '../model/advertencias';
import { CrearGatewayRequest, EditarGatewayRequest, GatewayResponse } from '../model/gateway';
import { manejarError } from '../util/errores';
import { UsuarioActivoService } from './usuario-activo.service';

@Injectable({
  providedIn: 'root'
})
export class GatewayService {
  constructor(
    private http: HttpClient,
    private usuarioActivo: UsuarioActivoService
  ) {}

  private urlBase(procesoId: number): string {
    return `${API_URL}/procesos/${procesoId}/gateways`;
  }

  // POST /api/procesos/{procesoId}/gateways?usuarioId=
  crear(procesoId: number, request: CrearGatewayRequest): Observable<GatewayResponse> {
    return this.http
      .post<GatewayResponse>(this.urlBase(procesoId), request, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // PUT /api/procesos/{procesoId}/gateways/{id}?usuarioId=
  editar(procesoId: number, id: number, request: EditarGatewayRequest): Observable<GatewayResponse> {
    return this.http
      .put<GatewayResponse>(`${this.urlBase(procesoId)}/${id}`, request, {
        params: this.usuarioActivo.crearParametros()
      })
      .pipe(catchError(manejarError));
  }

  // DELETE /api/procesos/{procesoId}/gateways/{id}?usuarioId=
  eliminar(procesoId: number, id: number): Observable<AdvertenciasResponse> {
    return this.http
      .delete<AdvertenciasResponse>(`${this.urlBase(procesoId)}/${id}`, {
        params: this.usuarioActivo.crearParametros()
      })
      .pipe(catchError(manejarError));
  }

  // GET /api/procesos/{procesoId}/gateways?usuarioId=
  listar(procesoId: number): Observable<GatewayResponse[]> {
    return this.http
      .get<GatewayResponse[]>(this.urlBase(procesoId), { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // GET /api/procesos/{procesoId}/gateways/{id}?usuarioId=
  obtener(procesoId: number, id: number): Observable<GatewayResponse> {
    return this.http
      .get<GatewayResponse>(`${this.urlBase(procesoId)}/${id}`, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }
}
