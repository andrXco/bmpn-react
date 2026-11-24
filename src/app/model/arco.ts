// La condicion solo aplica a los arcos que salen de un gateway exclusivo o inclusivo
export interface ArcoRequest {
  origenId: number;
  destinoId: number;
  etiqueta: string | null;
  condicion: string | null;
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
