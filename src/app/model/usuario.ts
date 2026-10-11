import { RolAcceso } from './rol-acceso';

// Solo se usa como parte de la respuesta al registrar una empresa (administradorInicial)
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
