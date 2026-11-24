import { is } from 'bpmn-js/lib/util/ModelUtil';
import { TipoActividad } from '../model/actividad';
import { TipoNodo } from '../model/diagrama';
import { DisparadorEvento, TipoEvento } from '../model/evento';
import { TipoGateway } from '../model/gateway';

// Elemento de bpmn-js (forma o flecha). Solo se usan estos campos.
export interface ElementoBpmn {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parent?: ElementoBpmn;
  source?: ElementoBpmn;
  target?: ElementoBpmn;
  labelTarget?: ElementoBpmn;
  incoming?: ElementoBpmn[];
  outgoing?: ElementoBpmn[];
  businessObject: { name?: string; eventDefinitions?: { $type: string }[] };
}

// Funciones que leen un elemento del dibujo y dicen a que corresponde en el backend

export function tipoDe(elemento: ElementoBpmn): TipoNodo | null {
  if (elemento.type === 'label') {
    return null;
  }
  if (is(elemento, 'bpmn:Task')) {
    return 'ACTIVIDAD';
  }
  if (is(elemento, 'bpmn:ExclusiveGateway') || is(elemento, 'bpmn:ParallelGateway') || is(elemento, 'bpmn:InclusiveGateway')) {
    return 'GATEWAY';
  }
  if (is(elemento, 'bpmn:StartEvent') || is(elemento, 'bpmn:EndEvent')
    || is(elemento, 'bpmn:IntermediateThrowEvent') || is(elemento, 'bpmn:IntermediateCatchEvent')) {
    return 'EVENTO';
  }
  return null;
}

// Prefijo del id en el dibujo (Actividad_3, Gateway_1...)
export function prefijo(tipo: TipoNodo): string {
  return tipo === 'ACTIVIDAD' ? 'Actividad' : tipo === 'GATEWAY' ? 'Gateway' : 'Evento';
}

export function tipoActividadDe(forma: ElementoBpmn): TipoActividad {
  if (is(forma, 'bpmn:UserTask')) {
    return TipoActividad.USUARIO;
  }
  if (is(forma, 'bpmn:ManualTask')) {
    return TipoActividad.MANUAL;
  }
  return is(forma, 'bpmn:ServiceTask') ? TipoActividad.SERVICIO : TipoActividad.TAREA;
}

export function tipoGatewayDe(forma: ElementoBpmn): TipoGateway {
  if (is(forma, 'bpmn:ParallelGateway')) {
    return TipoGateway.PARALELO;
  }
  return is(forma, 'bpmn:InclusiveGateway') ? TipoGateway.INCLUSIVO : TipoGateway.EXCLUSIVO;
}

export function eventoDe(forma: ElementoBpmn): { tipoEvento: TipoEvento; disparador: DisparadorEvento } {
  const conMensaje: boolean = (forma.businessObject.eventDefinitions ?? [])
    .some(d => d.$type === 'bpmn:MessageEventDefinition');
  if (is(forma, 'bpmn:StartEvent')) {
    return { tipoEvento: TipoEvento.INICIO, disparador: conMensaje ? DisparadorEvento.MENSAJE_RECEPCION : DisparadorEvento.NINGUNO };
  }
  if (is(forma, 'bpmn:EndEvent')) {
    return { tipoEvento: TipoEvento.FIN, disparador: conMensaje ? DisparadorEvento.MENSAJE_ENVIO : DisparadorEvento.NINGUNO };
  }
  if (is(forma, 'bpmn:IntermediateCatchEvent')) {
    return { tipoEvento: TipoEvento.INTERMEDIO, disparador: conMensaje ? DisparadorEvento.MENSAJE_RECEPCION : DisparadorEvento.NINGUNO };
  }
  return { tipoEvento: TipoEvento.INTERMEDIO, disparador: conMensaje ? DisparadorEvento.MENSAJE_ENVIO : DisparadorEvento.NINGUNO };
}

// Texto del tipo que se muestra en el panel de detalle
export function subtipoDe(forma: ElementoBpmn): string {
  const tipo: TipoNodo | null = tipoDe(forma);
  if (tipo === 'ACTIVIDAD') {
    return tipoActividadDe(forma);
  }
  if (tipo === 'GATEWAY') {
    return tipoGatewayDe(forma);
  }
  const evento = eventoDe(forma);
  return evento.disparador === DisparadorEvento.NINGUNO ? evento.tipoEvento : `${evento.tipoEvento} ${evento.disparador}`;
}

// Pool que contiene al elemento (puede estar dentro de una lane)
export function poolDe(elemento: ElementoBpmn): ElementoBpmn | undefined {
  let actual: ElementoBpmn | undefined = elemento.parent;
  while (actual && actual.type !== 'bpmn:Participant') {
    actual = actual.parent;
  }
  return actual;
}
