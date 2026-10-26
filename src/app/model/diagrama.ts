import { ActividadResponse } from './actividad';
import { ArcoResponse } from './arco';
import { EventoResponse } from './evento';
import { GatewayResponse } from './gateway';
import { LaneResponse } from './lane';
import { MensajeResponse } from './mensaje';
import { PoolResponse } from './pool';
import { ProcesoResponse } from './proceso';

// Todo lo que se pide al backend para armar el diagrama de un proceso
export interface DatosDiagrama {
  proceso: ProcesoResponse;
  pools: PoolResponse[];
  lanes: LaneResponse[][];
  actividades: ActividadResponse[];
  gateways: GatewayResponse[];
  eventos: EventoResponse[];
  arcos: ArcoResponse[];
  mensajes: MensajeResponse[];
}

export type TipoNodo = 'ACTIVIDAD' | 'GATEWAY' | 'EVENTO';

// Lo que muestra el panel de detalle del elemento seleccionado
export interface NodoDiagrama {
  id: number;
  tipo: TipoNodo;
  nombre: string;
  subtipo: string;
  posicionX: number;
  advertencias: string[];
}
