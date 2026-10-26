import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_URL } from '../config/api.config';
import { Pagina } from '../model/pagina';
import {
  CrearRolProcesoRequest,
  EditarRolProcesoRequest,
  FiltroRolProceso,
  RolProcesoResponse
} from '../model/rol-proceso';
import { manejarError } from '../util/errores';
import { UsuarioActivoService } from './usuario-activo.service';

@Injectable({
  providedIn: 'root'
})
export class RolProcesoService {
  private readonly http = inject(HttpClient);
  private readonly usuarioActivo = inject(UsuarioActivoService);
  private readonly url: string = `${API_URL}/roles-proceso`;

  // POST /api/roles-proceso?usuarioId=
  crear(request: CrearRolProcesoRequest): Observable<RolProcesoResponse> {
    return this.http
      .post<RolProcesoResponse>(this.url, request, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // PUT /api/roles-proceso/{id}?usuarioId=
  editar(id: number, request: EditarRolProcesoRequest): Observable<RolProcesoResponse> {
    return this.http
      .put<RolProcesoResponse>(`${this.url}/${id}`, request, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // DELETE /api/roles-proceso/{id}?usuarioId=
  eliminar(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.url}/${id}`, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // GET /api/roles-proceso?usuarioId=&nombre=&incluirInactivos=&page=&size=
  listar(filtro: FiltroRolProceso): Observable<Pagina<RolProcesoResponse>> {
    let params: HttpParams = this.usuarioActivo.crearParametros();
    if (filtro.nombre.trim() !== '') {
      params = params.set('nombre', filtro.nombre.trim());
    }
    params = params
      .set('incluirInactivos', String(filtro.incluirInactivos))
      .set('page', filtro.page.toString())
      .set('size', filtro.size.toString());

    return this.http
      .get<Pagina<RolProcesoResponse>>(this.url, { params: params })
      .pipe(catchError(manejarError));
  }

  // GET /api/roles-proceso/{id}?usuarioId=
  obtener(id: number): Observable<RolProcesoResponse> {
    return this.http
      .get<RolProcesoResponse>(`${this.url}/${id}`, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }
}
