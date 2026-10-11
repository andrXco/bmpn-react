export enum EstadoProceso {
  BORRADOR = 'BORRADOR',
  PUBLICADO = 'PUBLICADO'
}

export enum AccionHistorial {
  CREACION = 'CREACION',
  ACTUALIZACION = 'ACTUALIZACION',
  PUBLICACION = 'PUBLICACION',
  ELIMINACION = 'ELIMINACION'
}

export interface CrearProcesoRequest {
  nombre: string;
  descripcion: string;
  categoria: string;
}

export interface EditarProcesoRequest {
  nombre: string;
  descripcion: string;
  categoria: string;
  estado: EstadoProceso;
}

export interface ProcesoResponse {
  id: number;
  empresaId: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  estado: EstadoProceso;
  fechaCreacion: string;
  fechaActualizacion: string;
  activo: boolean;
  poolPropietarioId: number;
  poolPropietarioNombre: string;
}

export interface ProcesoResumen {
  id: number;
  nombre: string;
  categoria: string;
  estado: EstadoProceso;
  activo: boolean;
  fechaActualizacion: string;
}

export interface HistorialResponse {
  id: number;
  accion: AccionHistorial;
  detalle: string;
  fecha: string;
  nombreUsuario: string;
  emailUsuario: string;
}

// Filtros y paginación del listado (GET /api/procesos)
export interface FiltroProceso {
  nombre: string;
  estado: EstadoProceso | '';
  categoria: string;
  incluirInactivos: boolean;
  page: number;
  size: number;
}
