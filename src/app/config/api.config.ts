import { isDevMode } from '@angular/core';

// En desarrollo (ng serve) proxy.conf.json reenvia /api al backend en el puerto 8080.
// En la version compilada (Docker) se llama directo al backend, que tiene CORS habilitado.
export const API_URL: string = isDevMode() ? '/api' : 'http://localhost:8080/api';
