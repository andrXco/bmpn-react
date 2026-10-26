import { TipoActividad } from '../model/actividad';
import { DatosDiagrama } from '../model/diagrama';
import { DisparadorEvento, EventoResponse, TipoEvento } from '../model/evento';
import { TipoGateway } from '../model/gateway';
import { LaneResponse } from '../model/lane';
import { PoolResponse } from '../model/pool';

// El backend guarda posicionX y posicionY del centro de cada elemento, medidas desde la esquina del pool.
// En X se deja espacio para el nombre del pool y el de la lane.
export const MARGEN_X = 60;
export const ALTO_LANE = 150;
const ALTO_POOL_SIN_LANES = 150;
const ALTO_CAJA_NEGRA = 80;
const INICIO_X = 50;
const INICIO_Y = 50;
const SEPARACION_POOLS = 40;

const TAMANOS: Record<string, { ancho: number; alto: number }> = {
  ACTIVIDAD: { ancho: 100, alto: 80 },
  GATEWAY: { ancho: 50, alto: 50 },
  EVENTO: { ancho: 36, alto: 36 }
};

const ETIQUETA_ACTIVIDAD: Record<TipoActividad, string> = {
  TAREA: 'task',
  USUARIO: 'userTask',
  MANUAL: 'manualTask',
  SERVICIO: 'serviceTask'
};

const ETIQUETA_GATEWAY: Record<TipoGateway, string> = {
  EXCLUSIVO: 'exclusiveGateway',
  PARALELO: 'parallelGateway',
  INCLUSIVO: 'inclusiveGateway'
};

interface Caja {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

interface Nodo {
  bpmnId: string;
  poolId: number;
  laneId: number | null;
  xml: string;
  caja: Caja;
}

// Ids que usa bpmn-js para cada objeto del backend
export const idPool = (id: number): string => `Pool_${id}`;
export const idLane = (id: number): string => `Lane_${id}`;
export const idActividad = (id: number): string => `Actividad_${id}`;
export const idGateway = (id: number): string => `Gateway_${id}`;
export const idEvento = (id: number): string => `Evento_${id}`;
export const idArco = (id: number): string => `Arco_${id}`;
export const idMensaje = (id: number): string => `Mensaje_${id}`;

// "Actividad_12" -> 12; null si el elemento todavia no esta en el backend
export function numeroDeId(bpmnId: string, prefijo: string): number | null {
  const partes: RegExpMatchArray | null = bpmnId.match(new RegExp(`^${prefijo}_(\\d+)$`));
  return partes ? Number(partes[1]) : null;
}

function texto(valor: string | null | undefined): string {
  return (valor ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function etiquetaEvento(evento: EventoResponse): string {
  if (evento.tipoEvento === TipoEvento.INICIO) {
    return 'startEvent';
  }
  if (evento.tipoEvento === TipoEvento.FIN) {
    return 'endEvent';
  }
  return evento.disparador === DisparadorEvento.MENSAJE_RECEPCION ? 'intermediateCatchEvent' : 'intermediateThrowEvent';
}

function forma(bpmnId: string, caja: Caja, extra: string = ''): string {
  return `<bpmndi:BPMNShape id="${bpmnId}_di" bpmnElement="${bpmnId}"${extra}>` +
    `<dc:Bounds x="${caja.x}" y="${caja.y}" width="${caja.ancho}" height="${caja.alto}" /></bpmndi:BPMNShape>`;
}

function linea(bpmnId: string, puntos: number[][]): string {
  const waypoints: string = puntos.map(p => `<di:waypoint x="${p[0]}" y="${p[1]}" />`).join('');
  return `<bpmndi:BPMNEdge id="${bpmnId}_di" bpmnElement="${bpmnId}">${waypoints}</bpmndi:BPMNEdge>`;
}

// Recorrido inicial de una flecha; despues bpmn-js la acomoda sola cuando se mueven los elementos
function puntosArco(origen: Caja, destino: Caja): number[][] {
  const yOrigen: number = origen.y + origen.alto / 2;
  const yDestino: number = destino.y + destino.alto / 2;
  const xSalida: number = origen.x + origen.ancho;
  if (destino.x >= xSalida) {
    if (yOrigen === yDestino) {
      return [[xSalida, yOrigen], [destino.x, yDestino]];
    }
    const medio: number = (xSalida + destino.x) / 2;
    return [[xSalida, yOrigen], [medio, yOrigen], [medio, yDestino], [destino.x, yDestino]];
  }
  const xOrigen: number = origen.x + origen.ancho / 2;
  const xDestino: number = destino.x + destino.ancho / 2;
  const abajo: number = Math.max(origen.y + origen.alto, destino.y + destino.alto) + 20;
  return [[xOrigen, origen.y + origen.alto], [xOrigen, abajo], [xDestino, abajo], [xDestino, destino.y + destino.alto]];
}

function puntosMensaje(origen: Caja, destino: Caja): number[][] {
  const xOrigen: number = origen.x + origen.ancho / 2;
  const xDestino: number = destino.x + destino.ancho / 2;
  const baja: boolean = destino.y > origen.y;
  const yOrigen: number = baja ? origen.y + origen.alto : origen.y;
  const yDestino: number = baja ? destino.y : destino.y + destino.alto;
  const medio: number = (yOrigen + yDestino) / 2;
  return [[xOrigen, yOrigen], [xOrigen, medio], [xDestino, medio], [xDestino, yDestino]];
}

export function generarXml(datos: DatosDiagrama): string {
  const pools: PoolResponse[] = [...datos.pools].sort((a, b) => a.orden - b.orden);
  const lanesDe = (pool: PoolResponse): LaneResponse[] =>
    [...(datos.lanes[datos.pools.indexOf(pool)] ?? [])].sort((a, b) => a.orden - b.orden);

  // Ancho comun para todos los pools, segun el elemento que este mas a la derecha
  const masDerecha: number = Math.max(0,
    ...datos.actividades.map(a => a.posicionX), ...datos.gateways.map(g => g.posicionX),
    ...datos.eventos.map(e => e.posicionX));
  const anchoPool: number = Math.max(900, MARGEN_X + masDerecha + 150);

  const cajasPool = new Map<number, Caja>();
  let y: number = INICIO_Y;
  pools.forEach(pool => {
    const lanes: LaneResponse[] = lanesDe(pool);
    const alto: number = pool.cajaNegra ? ALTO_CAJA_NEGRA : Math.max(lanes.length * ALTO_LANE, ALTO_POOL_SIN_LANES);
    cajasPool.set(pool.id, { x: INICIO_X, y: y, ancho: anchoPool, alto: alto });
    y += alto + SEPARACION_POOLS;
  });

  // Ubica un elemento: si tiene lane, su centro queda dentro de la franja de esa lane
  const ubicar = (tipo: string, poolId: number, laneId: number | null, posX: number, posY: number): Caja | null => {
    const pool: PoolResponse | undefined = pools.find(p => p.id === poolId);
    const cajaPool: Caja | undefined = cajasPool.get(poolId);
    if (!pool || !cajaPool) {
      return null;
    }
    const tamano = TAMANOS[tipo];
    let centroY: number = posY;
    const indiceLane: number = lanesDe(pool).findIndex(l => l.id === laneId);
    if (indiceLane >= 0) {
      const arriba: number = indiceLane * ALTO_LANE;
      if (centroY < arriba + tamano.alto / 2 || centroY > arriba + ALTO_LANE - tamano.alto / 2) {
        centroY = arriba + ALTO_LANE / 2;
      }
    }
    centroY = Math.min(Math.max(centroY, tamano.alto / 2 + 5), cajaPool.alto - tamano.alto / 2 - 5);
    return {
      x: cajaPool.x + MARGEN_X + posX - tamano.ancho / 2,
      y: cajaPool.y + centroY - tamano.alto / 2,
      ancho: tamano.ancho,
      alto: tamano.alto
    };
  };

  const nodos: Nodo[] = [];
  datos.actividades.forEach(a => {
    const caja: Caja | null = ubicar('ACTIVIDAD', a.poolId, a.laneId, a.posicionX, a.posicionY);
    const etiqueta: string = ETIQUETA_ACTIVIDAD[a.tipoActividad];
    if (caja) {
      nodos.push({ bpmnId: idActividad(a.id), poolId: a.poolId, laneId: a.laneId, caja,
        xml: `<bpmn:${etiqueta} id="${idActividad(a.id)}" name="${texto(a.nombre)}" />` });
    }
  });
  datos.gateways.forEach(g => {
    const caja: Caja | null = ubicar('GATEWAY', g.poolId, null, g.posicionX, g.posicionY);
    const etiqueta: string = ETIQUETA_GATEWAY[g.tipoGateway];
    if (caja) {
      nodos.push({ bpmnId: idGateway(g.id), poolId: g.poolId, laneId: null, caja,
        xml: `<bpmn:${etiqueta} id="${idGateway(g.id)}" name="${texto(g.nombre)}" />` });
    }
  });
  datos.eventos.forEach(e => {
    const caja: Caja | null = ubicar('EVENTO', e.poolId, e.laneId, e.posicionX, e.posicionY);
    const etiqueta: string = etiquetaEvento(e);
    const mensaje: string = e.disparador !== DisparadorEvento.NINGUNO
      ? `<bpmn:messageEventDefinition id="${idEvento(e.id)}_mensaje" />` : '';
    if (caja) {
      nodos.push({ bpmnId: idEvento(e.id), poolId: e.poolId, laneId: e.laneId, caja,
        xml: `<bpmn:${etiqueta} id="${idEvento(e.id)}" name="${texto(e.nombre)}">${mensaje}</bpmn:${etiqueta}>` });
    }
  });
  const cajaDe = new Map<string, Caja>(nodos.map(n => [n.bpmnId, n.caja]));
  const poolDe = new Map<string, number>(nodos.map(n => [n.bpmnId, n.poolId]));
  const nombreElemento = (id: number): string =>
    [idActividad(id), idGateway(id), idEvento(id)].find(bpmnId => cajaDe.has(bpmnId)) ?? '';

  let participantes: string = '';
  let procesos: string = '';
  let formas: string = '';

  pools.forEach(pool => {
    const caja: Caja = cajasPool.get(pool.id) as Caja;
    const lanes: LaneResponse[] = lanesDe(pool);
    const procesoId: string = `Proceso_${pool.id}`;
    participantes += pool.cajaNegra
      ? `<bpmn:participant id="${idPool(pool.id)}" name="${texto(pool.nombre)}" />`
      : `<bpmn:participant id="${idPool(pool.id)}" name="${texto(pool.nombre)}" processRef="${procesoId}" />`;
    formas += forma(idPool(pool.id), caja, ' isHorizontal="true"');
    if (pool.cajaNegra) {
      return;
    }

    const delPool: Nodo[] = nodos.filter(n => n.poolId === pool.id);
    let contenido: string = '';
    if (lanes.length > 0) {
      contenido += `<bpmn:laneSet id="LaneSet_${pool.id}">`;
      lanes.forEach((lane, i) => {
        const arriba: number = caja.y + i * ALTO_LANE;
        // Un elemento sin lane (los gateways) queda en la lane donde esta dibujado
        const refs: string = delPool
          .filter(n => n.laneId === lane.id
            || (n.laneId === null && n.caja.y + n.caja.alto / 2 >= arriba && n.caja.y + n.caja.alto / 2 < arriba + ALTO_LANE))
          .map(n => `<bpmn:flowNodeRef>${n.bpmnId}</bpmn:flowNodeRef>`).join('');
        contenido += `<bpmn:lane id="${idLane(lane.id)}" name="${texto(lane.nombreRol)}">${refs}</bpmn:lane>`;
        formas += forma(idLane(lane.id), { x: caja.x + 30, y: arriba, ancho: caja.ancho - 30, alto: ALTO_LANE },
          ' isHorizontal="true"');
      });
      contenido += '</bpmn:laneSet>';
    }
    contenido += delPool.map(n => n.xml).join('');
    delPool.forEach(n => formas += forma(n.bpmnId, n.caja));

    datos.arcos.forEach(arco => {
      const origen: string = nombreElemento(arco.origenId);
      const destino: string = nombreElemento(arco.destinoId);
      if (poolDe.get(origen) !== pool.id || !cajaDe.has(destino)) {
        return;
      }
      const nombre: string = arco.condicion ?? arco.etiqueta ?? '';
      contenido += `<bpmn:sequenceFlow id="${idArco(arco.id)}" name="${texto(nombre)}" sourceRef="${origen}" targetRef="${destino}" />`;
      formas += linea(idArco(arco.id), puntosArco(cajaDe.get(origen) as Caja, cajaDe.get(destino) as Caja));
    });

    procesos += `<bpmn:process id="${procesoId}" isExecutable="false">${contenido}</bpmn:process>`;
  });

  let flujosMensaje: string = '';
  datos.mensajes.forEach(mensaje => {
    const origen: string = idEvento(mensaje.eventoEnvioId);
    const destino: string = mensaje.eventoRecepcionId !== null ? idEvento(mensaje.eventoRecepcionId) : idPool(mensaje.poolDestinoId);
    const cajaOrigen: Caja | undefined = cajaDe.get(origen);
    const cajaDestino: Caja | undefined = cajaDe.get(destino) ?? cajasPool.get(mensaje.poolDestinoId);
    if (!cajaOrigen || !cajaDestino) {
      return;
    }
    flujosMensaje += `<bpmn:messageFlow id="${idMensaje(mensaje.id)}" name="${texto(mensaje.nombre)}" sourceRef="${origen}" targetRef="${destino}" />`;
    formas += linea(idMensaje(mensaje.id), puntosMensaje(cajaOrigen, cajaDestino));
  });

  return '<?xml version="1.0" encoding="UTF-8"?>' +
    '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" ' +
    'xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" ' +
    'xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definiciones" targetNamespace="http://bpmn.io/schema/bpmn">' +
    `<bpmn:collaboration id="Colaboracion">${participantes}${flujosMensaje}</bpmn:collaboration>` +
    procesos +
    `<bpmndi:BPMNDiagram id="Diagrama"><bpmndi:BPMNPlane id="Plano" bpmnElement="Colaboracion">${formas}` +
    '</bpmndi:BPMNPlane></bpmndi:BPMNDiagram></bpmn:definitions>';
}
