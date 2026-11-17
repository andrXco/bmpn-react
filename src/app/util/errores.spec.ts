import { HttpErrorResponse } from '@angular/common/http';
import { ErrorDto } from '../model/error-dto';
import { convertirError, manejarError } from './errores';

describe('errores', () => {
  const respuesta = (status: number, error: unknown = null) => new HttpErrorResponse({ status, error });

  it('informa falta de conexión cuando el status es 0', () => {
    const error: ErrorDto = convertirError(respuesta(0));

    expect(error.codigo).toBe('SIN_CONEXION');
    expect(error.mensaje).toContain('No se pudo conectar con el servidor');
  });

  it('no expone el detalle de un error 5xx', () => {
    const error: ErrorDto = convertirError(respuesta(500, { mensaje: 'org.postgresql.util.PSQLException: ...' }));

    expect(error.codigo).toBe('ERROR_SERVIDOR');
    expect(error.mensaje).not.toContain('PSQL');
  });

  it('usa el ErrorDto que manda el backend en un 409', () => {
    const cuerpo: ErrorDto = {
      codigo: 'RECURSO_DUPLICADO',
      mensaje: 'Ya existe un proceso con ese nombre en la empresa',
      fecha: '2026-11-16T10:00:00Z',
      detalles: []
    };

    expect(convertirError(respuesta(409, cuerpo))).toEqual(cuerpo);
  });

  it('conserva los detalles de validación de un 400', () => {
    const cuerpo = {
      codigo: 'SOLICITUD_INVALIDA',
      mensaje: 'Uno o mas campos no cumplen las reglas de validacion',
      fecha: '2026-11-16T10:00:00Z',
      detalles: ['nombre: El nombre del proceso es obligatorio']
    };

    expect(convertirError(respuesta(400, cuerpo)).detalles).toEqual(['nombre: El nombre del proceso es obligatorio']);
  });

  it('devuelve un mensaje genérico si el error no trae cuerpo', () => {
    const error: ErrorDto = convertirError(respuesta(404));

    expect(error.codigo).toBe('ERROR_DESCONOCIDO');
    expect(error.mensaje).toContain('404');
  });

  it('manejarError entrega al suscriptor el ErrorDto ya convertido', () => {
    let recibido: ErrorDto | null = null;
    manejarError(respuesta(0)).subscribe({ error: (error: ErrorDto) => (recibido = error) });

    expect(recibido!.codigo).toBe('SIN_CONEXION');
  });
});