import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ErrorDto } from '../model/error-dto';

// Convierte el error HTTP de Angular en un ErrorDto con un mensaje comprensible para el usuario.
// Los detalles técnicos no se muestran: el errorInterceptor los registra en la consola.
export function convertirError(error: HttpErrorResponse): ErrorDto {
  // Fallo de red, timeout o CORS
  if (error.status === 0) {
    return {
      codigo: 'SIN_CONEXION',
      mensaje: 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en el puerto 8080.',
      fecha: new Date().toISOString(),
      detalles: []
    };
  }

  // Error de servidor (5xx): mensaje genérico, sin exponer detalles internos
  if (error.status >= 500) {
    return {
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'El servidor tuvo un problema al procesar la solicitud. Intenta de nuevo más tarde.',
      fecha: new Date().toISOString(),
      detalles: []
    };
  }

  // 400, 403, 404, 409...: el backend envía un ErrorDto con el mensaje de la regla de negocio
  const cuerpo: ErrorDto | null = error.error as ErrorDto | null;
  if (cuerpo !== null && typeof cuerpo === 'object' && typeof cuerpo.mensaje === 'string') {
    return {
      codigo: cuerpo.codigo,
      mensaje: cuerpo.mensaje,
      fecha: cuerpo.fecha,
      detalles: Array.isArray(cuerpo.detalles) ? cuerpo.detalles : []
    };
  }

  return {
    codigo: 'ERROR_DESCONOCIDO',
    mensaje: 'Ocurrió un error inesperado (código HTTP ' + error.status + ').',
    fecha: new Date().toISOString(),
    detalles: []
  };
}

// Se usa con catchError en los servicios: los componentes reciben un ErrorDto tipado
export function manejarError(error: HttpErrorResponse): Observable<never> {
  return throwError(() => convertirError(error));
}
