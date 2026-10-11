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
