import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_URL } from '../config/api.config';
import { IniciarSesionRequest, SesionUsuarioResponse } from '../model/sesion';
import { manejarError } from '../util/errores';

@Injectable({
  providedIn: 'root'
})
export class AutenticacionService {
  private readonly url: string = `${API_URL}/sesiones`;

  constructor(private http: HttpClient) {}

  // POST /api/sesiones  (no lleva usuarioId)
  iniciarSesion(request: IniciarSesionRequest): Observable<SesionUsuarioResponse> {
    return this.http.post<SesionUsuarioResponse>(this.url, request).pipe(catchError(manejarError));
  }
}
