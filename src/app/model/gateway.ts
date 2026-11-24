export enum TipoGateway {
  EXCLUSIVO = 'EXCLUSIVO',
  PARALELO = 'PARALELO',
  INCLUSIVO = 'INCLUSIVO'
}

export interface CrearGatewayRequest {
  nombre: string;
  tipoGateway: TipoGateway;
  posicionX: number;
  posicionY: number;
  poolId: number | null;
}

export interface EditarGatewayRequest {
  nombre: string;
  tipoGateway: TipoGateway;
  posicionX: number;
  posicionY: number;
}

export interface GatewayResponse {
  id: number;
  procesoId: number;
  poolId: number;
  nombre: string;
  tipoGateway: TipoGateway;
  posicionX: number;
  posicionY: number;
  activo: boolean;
  advertencias: string[];
}
