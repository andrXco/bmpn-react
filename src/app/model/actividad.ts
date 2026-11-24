export enum TipoActividad {
  TAREA = 'TAREA',
  USUARIO = 'USUARIO',
  MANUAL = 'MANUAL',
  SERVICIO = 'SERVICIO'
}

export interface CrearActividadRequest {
  nombre: string;
  tipoActividad: TipoActividad;
  posicionX: number;
  posicionY: number;
  laneId: number;
  poolId: number | null;
}

export interface EditarActividadRequest {
  nombre: string;
  tipoActividad: TipoActividad;
  posicionX: number;
  posicionY: number;
  laneId: number;
}

export interface ActividadResponse {
  id: number;
  procesoId: number;
  poolId: number;
  laneId: number;
  nombre: string;
  tipoActividad: TipoActividad;
  posicionX: number;
  posicionY: number;
  activo: boolean;
}
