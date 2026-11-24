import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AutenticacionService } from '../service/autenticacion.service';
import { UsuarioActivoService } from '../service/usuario-activo.service';

// Política global de errores HTTP:
//  - registra el detalle técnico en la consola (no se muestra al usuario)
//  - 401: la sesión no es válida, se limpia el usuario activo
//  - cualquier otro error se propaga: cada componente muestra su mensaje según su contexto
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const usuarioActivo: UsuarioActivoService = inject(UsuarioActivoService);
  const autenticacion: AutenticacionService = inject(AutenticacionService);
  const esEndpointSesion: boolean = req.url.includes('/sesiones');
  const token: string | null = esEndpointSesion ? null : usuarioActivo.accessToken;
  const solicitud = token === null
    ? req
    : req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return next(solicitud).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(`[HTTP ${error.status}] ${req.method} ${req.url}`, error.error);

      if (error.status === 401 && token !== null && !esEndpointSesion) {
        return autenticacion.renovarSesion().pipe(
          switchMap((sesion) => {
            const reintento = req.clone({
              setHeaders: { Authorization: `Bearer ${sesion.accessToken}` }
            });
            return next(reintento).pipe(
              catchError((errorReintento: HttpErrorResponse) => {
                console.error(`[HTTP ${errorReintento.status}] ${req.method} ${req.url}`, errorReintento.error);
                if (errorReintento.status === 401) {
                  usuarioActivo.limpiar();
                }
                return throwError(() => errorReintento);
              })
            );
          }),
          catchError((errorRenovacion: unknown) => {
            usuarioActivo.limpiar();
            return throwError(() => errorRenovacion);
          })
        );
      }

      if (error.status === 401 && !esEndpointSesion) {
        usuarioActivo.limpiar();
      }

      return throwError(() => error);
    })
  );
};
