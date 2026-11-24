// POST /api/procesos/{procesoId}/pools/{poolId}/lanes  y  PUT .../lanes/{laneId}
export interface CrearLaneRequest {
  rolProcesoId: number;
}

export interface EditarLaneRequest {
  rolProcesoId: number;
}

export interface LaneResponse {
  id: number;
  poolId: number;
  rolProcesoId: number;
  nombreRol: string;
  orden: number;
  activo: boolean;
}
