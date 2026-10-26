export interface CrearArcoRequest {
  origenId: number;
  destinoId: number;
  etiqueta?: string | null;
  condicion?: string | null;
}

export interface EditarArcoRequest {
  origenId: number;
  destinoId: number;
  etiqueta?: string | null;
  condicion?: string | null;
}

export interface ArcoResponse {
  id: number;
  procesoId: number;
  origenId: number;
  destinoId: number;
  etiqueta: string | null;
  condicion: string | null;
  activo: boolean;
}
