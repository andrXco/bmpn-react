// Estado explícito de una pantalla: idle (sin hacer nada), loading (cargando/guardando),
// success (operación exitosa) y error (la operación falló)
export type EstadoPantalla = 'idle' | 'loading' | 'success' | 'error';
