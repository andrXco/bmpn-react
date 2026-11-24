import { RolAcceso } from './rol-acceso';

export enum TipoParticipante {
  EMPRESA_PROPIETARIA = 'EMPRESA_PROPIETARIA',
  CLIENTE = 'CLIENTE',
  PROVEEDOR = 'PROVEEDOR',
  SISTEMA_EXTERNO = 'SISTEMA_EXTERNO'
}

export interface CrearPoolRequest {
  nombre: string;
  tipoParticipante: TipoParticipante;
  empresaParticipanteId: number | null;
  canalExterno: string | null;
  cajaNegra: boolean;
}

export interface EditarPoolRequest {
  nombre: string;
  canalExterno: string | null;
  cajaNegra: boolean;
}

export interface PoolResponse {
  id: number;
  procesoId: number;
  empresaParticipanteId: number | null;
  nombre: string;
  tipoParticipante: TipoParticipante;
  canalExterno: string | null;
  cajaNegra: boolean;
  orden: number;
  activo: boolean;
}

// HU-24: roles de proceso que se pueden usar en las lanes del pool
export interface AsociarRolPoolRequest {
  rolProcesoId: number;
}

export interface RolPoolResponse {
  poolId: number;
  rolProcesoId: number;
  nombreRol: string;
  activo: boolean;
}

// HU-24: que puede hacer cada rol de acceso con los pools y lanes
export interface PermisoPoolRequest {
  rolAcceso: RolAcceso;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
}

export interface PermisoPoolResponse {
  id: number;
  poolId: number;
  rolAcceso: RolAcceso;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
}
