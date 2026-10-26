import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_URL } from '../config/api.config';
import { Pagina } from '../model/pagina';
import {
  CrearProcesoRequest,
  EditarProcesoRequest,
  FiltroProceso,
  HistorialResponse,
  ProcesoResponse,
  ProcesoResumen
} from '../model/proceso';
import { manejarError } from '../util/errores';
import { UsuarioActivoService } from './usuario-activo.service';

@Injectable({
  providedIn: 'root'
})
export class ProcesoService {
  private readonly http = inject(HttpClient);
  private readonly usuarioActivo = inject(UsuarioActivoService);
  private readonly url: string = `${API_URL}/procesos`;

  // POST /api/procesos?usuarioId=
  crear(request: CrearProcesoRequest): Observable<ProcesoResponse> {
    return this.http
      .post<ProcesoResponse>(this.url, request, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // PUT /api/procesos/{id}?usuarioId=
  editar(id: number, request: EditarProcesoRequest): Observable<ProcesoResponse> {
    return this.http
      .put<ProcesoResponse>(`${this.url}/${id}`, request, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // DELETE /api/procesos/{id}?usuarioId=
  eliminar(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.url}/${id}`, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // GET /api/procesos?usuarioId=&nombre=&estado=&categoria=&incluirInactivos=&page=&size=
  listar(filtro: FiltroProceso): Observable<Pagina<ProcesoResumen>> {
    let params: HttpParams = this.usuarioActivo.crearParametros();
    if (filtro.nombre.trim() !== '') {
      params = params.set('nombre', filtro.nombre.trim());
    }
    if (filtro.estado !== '') {
      params = params.set('estado', filtro.estado);
    }
    if (filtro.categoria.trim() !== '') {
      params = params.set('categoria', filtro.categoria.trim());
    }
    params = params
      .set('incluirInactivos', String(filtro.incluirInactivos))
      .set('page', filtro.page.toString())
      .set('size', filtro.size.toString());

    return this.http
      .get<Pagina<ProcesoResumen>>(this.url, { params: params })
      .pipe(catchError(manejarError));
  }

  // GET /api/procesos/{id}?usuarioId=
  obtener(id: number): Observable<ProcesoResponse> {
    return this.http
      .get<ProcesoResponse>(`${this.url}/${id}`, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // GET /api/procesos/{id}/historial?usuarioId=
  obtenerHistorial(id: number): Observable<HistorialResponse[]> {
    return this.http
      .get<HistorialResponse[]>(`${this.url}/${id}/historial`, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }
}
