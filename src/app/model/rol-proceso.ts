export interface CrearRolProcesoRequest {
  nombre: string;
  descripcion: string;
}

export interface EditarRolProcesoRequest {
  nombre: string;
  descripcion: string;
}

export interface RolProcesoResponse {
  id: number;
  empresaId: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  procesosEnUso: string[];
  puedeEliminarse: boolean;
}

// Filtros y paginación del listado (GET /api/roles-proceso)
export interface FiltroRolProceso {
  nombre: string;
  incluirInactivos: boolean;
  page: number;
  size: number;
}
