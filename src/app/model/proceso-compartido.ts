// POST /api/procesos/{procesoId}/compartidos
export interface CompartirProcesoRequest {
  empresaInvitadaId: number;
}

export interface ProcesoCompartidoResponse {
  id: number;
  procesoId: number;
  empresaInvitadaId: number;
  nombreEmpresaInvitada: string;
  fechaCreacion: string;
  activo: boolean;
}
