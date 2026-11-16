import { RolAcceso } from './rol-acceso';

// POST /api/sesiones
export interface IniciarSesionRequest {
  email: string;
  password: string;
}

export interface DatosSesionUsuario {
  usuarioId: number;
  empresaId: number;
  email: string;
  nombreCompleto: string;
  rolAcceso: RolAcceso;
}

export interface SesionUsuarioResponse extends DatosSesionUsuario {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}
