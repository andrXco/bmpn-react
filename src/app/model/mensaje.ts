export enum PoliticaSinCorrespondencia {
  DESCARTAR = 'DESCARTAR',
  INICIAR_CASO_NUEVO = 'INICIAR_CASO_NUEVO'
}

export enum PoliticaFallo {
  CONTINUAR = 'CONTINUAR',
  IR_A_ACTIVIDAD_DE_ERROR = 'IR_A_ACTIVIDAD_DE_ERROR',
  FINALIZAR_PROCESO = 'FINALIZAR_PROCESO'
}

export interface CampoMensaje {
  nombre: string;
  tipoDato: string;
  descripcion: string | null;
  obligatorio: boolean;
}

export interface CrearMensajeRequest {
  eventoEnvioId: number;
  eventoRecepcionId: number | null;
  poolDestinoId: number | null;
  nombre: string;
  claveCorrelacion: string | null;
  politicaSinCorrespondencia: PoliticaSinCorrespondencia | null;
  politicaFallo: PoliticaFallo | null;
  campos: CampoMensaje[];
}

export interface MensajeResponse {
  id: number;
  procesoId: number;
  poolOrigenId: number;
  poolDestinoId: number;
  eventoEnvioId: number;
  eventoRecepcionId: number | null;
  nombre: string;
  claveCorrelacion: string | null;
  politicaSinCorrespondencia: PoliticaSinCorrespondencia | null;
  politicaFallo: PoliticaFallo | null;
  notificacionExterna: boolean;
  canalDestino: string | null;
  activo: boolean;
  campos: CampoMensaje[];
  advertencias: string[];
}
