import { RolAcceso } from './rol-acceso';

// Respuesta del módulo de usuarios (también es el administradorInicial al registrar una empresa)
export interface UsuarioResponse {
  id: number;
  empresaId: number;
  email: string;
  nombre: string;
  apellido: string;
  rolAcceso: RolAcceso;
  fechaCreacion: string;
  activo: boolean;
}

// POST /api/usuarios
export interface RegistrarUsuarioRequest {
  email: string;
  nombre: string;
  apellido: string;
  password: string;
  rolAcceso: RolAcceso;
}

// PATCH /api/usuarios/{id}/rol
export interface CambiarRolUsuarioRequest {
  rolAcceso: RolAcceso;
}
