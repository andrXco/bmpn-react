import { RolAcceso } from './rol-acceso';

// POST /api/sesiones
export interface IniciarSesionRequest {
  email: string;
  password: string;
}

export interface SesionUsuarioResponse {
  usuarioId: number;
  empresaId: number;
  email: string;
  nombreCompleto: string;
  rolAcceso: RolAcceso;
}
