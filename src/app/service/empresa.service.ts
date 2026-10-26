import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_URL } from '../config/api.config';
import { EmpresaResponse, RegistrarEmpresaRequest } from '../model/empresa';
import { manejarError } from '../util/errores';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private readonly http = inject(HttpClient);
  private readonly url: string = `${API_URL}/empresas`;

  // POST /api/empresas
  registrar(request: RegistrarEmpresaRequest): Observable<EmpresaResponse> {
    return this.http
      .post<EmpresaResponse>(this.url, request)
      .pipe(catchError(manejarError));
  }
}
