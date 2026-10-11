import { UsuarioResponse } from './usuario';

export interface RegistrarEmpresaRequest {
  nit: string;
  nombreEmpresa: string;
  correoContacto: string;
  nombreAdministrador: string;
  apellidoAdministrador: string;
  emailAdministrador: string;
  password: string;
}

export interface EmpresaResponse {
  id: number;
  nit: string;
  nombre: string;
  correoContacto: string;
  fechaCreacion: string;
  activo: boolean;
  administradorInicial: UsuarioResponse;
}
