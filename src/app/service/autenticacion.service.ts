import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { API_URL } from '../config/api.config';
import { IniciarSesionRequest, SesionUsuarioResponse } from '../model/sesion';
import { manejarError } from '../util/errores';
import { UsuarioActivoService } from './usuario-activo.service';

@Injectable({
  providedIn: 'root'
})
export class AutenticacionService {
  private readonly url: string = `${API_URL}/sesiones`;
  private renovacionEnCurso: Observable<SesionUsuarioResponse> | null = null;

  constructor(
    private http: HttpClient,
    private usuarioActivo: UsuarioActivoService
  ) {}

  // POST /api/sesiones  (no lleva usuarioId)
  iniciarSesion(request: IniciarSesionRequest): Observable<SesionUsuarioResponse> {
    return this.http
      .post<SesionUsuarioResponse>(this.url, request, { withCredentials: true })
      .pipe(catchError(manejarError));
  }

  renovarSesion(): Observable<SesionUsuarioResponse> {
    if (this.renovacionEnCurso === null) {
      this.renovacionEnCurso = this.http
        .post<SesionUsuarioResponse>(`${this.url}/renovacion`, null, { withCredentials: true })
        .pipe(
          tap((sesion: SesionUsuarioResponse) => this.usuarioActivo.iniciarSesion(sesion)),
          finalize(() => (this.renovacionEnCurso = null)),
          shareReplay({ bufferSize: 1, refCount: false })
        );
    }

    return this.renovacionEnCurso;
  }

  restaurarSesion(): Observable<void> {
    return this.renovarSesion().pipe(
      map(() => void 0),
      catchError(() => {
        this.usuarioActivo.limpiar();
        return of(void 0);
      })
    );
  }

  cerrarSesion(): Observable<void> {
    return this.http.delete<void>(this.url, { withCredentials: true }).pipe(catchError(manejarError));
  }
}
