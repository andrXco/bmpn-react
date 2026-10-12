import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { UsuarioActivoService } from '../service/usuario-activo.service';

// Política global de errores HTTP:
//  - registra el detalle técnico en la consola (no se muestra al usuario)
//  - 401: la sesión no es válida, se limpia el usuario activo
//  - cualquier otro error se propaga: cada componente muestra su mensaje según su contexto
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const usuarioActivo: UsuarioActivoService = inject(UsuarioActivoService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(`[HTTP ${error.status}] ${req.method} ${req.url}`, error.error);

      if (error.status === 401) {
        usuarioActivo.limpiar();
      }

      return throwError(() => error);
    })
  );
};
