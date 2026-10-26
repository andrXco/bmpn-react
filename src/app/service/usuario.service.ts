import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_URL } from '../config/api.config';
import { CambiarRolUsuarioRequest, RegistrarUsuarioRequest, UsuarioResponse } from '../model/usuario';
import { manejarError } from '../util/errores';
import { UsuarioActivoService } from './usuario-activo.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly usuarioActivo = inject(UsuarioActivoService);
  private readonly url: string = `${API_URL}/usuarios`;

  // GET /api/usuarios?usuarioId=
  listar(): Observable<UsuarioResponse[]> {
    return this.http
      .get<UsuarioResponse[]>(this.url, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // POST /api/usuarios?usuarioId=
  registrar(request: RegistrarUsuarioRequest): Observable<UsuarioResponse> {
    return this.http
      .post<UsuarioResponse>(this.url, request, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // PATCH /api/usuarios/{id}/rol?usuarioId=
  cambiarRol(id: number, request: CambiarRolUsuarioRequest): Observable<UsuarioResponse> {
    return this.http
      .patch<UsuarioResponse>(`${this.url}/${id}/rol`, request, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }

  // DELETE /api/usuarios/{id}?usuarioId=   (desactiva al usuario)
  desactivar(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.url}/${id}`, { params: this.usuarioActivo.crearParametros() })
      .pipe(catchError(manejarError));
  }
}
