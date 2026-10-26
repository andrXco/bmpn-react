export enum TipoEvento {
  INICIO = 'INICIO',
  INTERMEDIO = 'INTERMEDIO',
  FIN = 'FIN'
}

export enum DisparadorEvento {
  NINGUNO = 'NINGUNO',
  MENSAJE_ENVIO = 'MENSAJE_ENVIO',
  MENSAJE_RECEPCION = 'MENSAJE_RECEPCION'
}

export interface CrearEventoRequest {
  nombre: string;
  tipoEvento: TipoEvento;
  disparador: DisparadorEvento;
  origenExterno: boolean;
  posicionX: number;
  posicionY: number;
  poolId?: number | null;
  laneId?: number | null;
}

export interface EditarEventoRequest {
  nombre: string;
  tipoEvento: TipoEvento;
  disparador: DisparadorEvento;
  origenExterno: boolean;
  posicionX: number;
  posicionY: number;
  laneId?: number | null;
}

export interface EventoResponse {
  id: number;
  procesoId: number;
  poolId: number;
  laneId: number | null;
  nombre: string;
  tipoEvento: TipoEvento;
  disparador: DisparadorEvento;
  origenExterno: boolean;
  posicionX: number;
  posicionY: number;
  activo: boolean;
  advertencias: string[];
}

