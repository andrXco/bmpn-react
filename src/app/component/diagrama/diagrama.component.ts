import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ActividadResponse } from '../../model/actividad';
import { ArcoResponse } from '../../model/arco';
import { FilaDiagrama, LineaDiagrama, NodoDiagrama, PoolDiagrama } from '../../model/diagrama';
import { ErrorDto } from '../../model/error-dto';
import { EstadoPantalla } from '../../model/estado-pantalla';
import { DisparadorEvento, EventoResponse } from '../../model/evento';
import { GatewayResponse } from '../../model/gateway';
import { LaneResponse } from '../../model/lane';
import { MensajeResponse } from '../../model/mensaje';
import { PoolResponse } from '../../model/pool';
import { ProcesoResponse } from '../../model/proceso';
import { ActividadService } from '../../service/actividad.service';
import { ArcoService } from '../../service/arco.service';
import { EventoService } from '../../service/evento.service';
import { GatewayService } from '../../service/gateway.service';
import { LaneService } from '../../service/lane.service';
import { MensajeService } from '../../service/mensaje.service';
import { PoolService } from '../../service/pool.service';
import { ProcesoService } from '../../service/proceso.service';
import { DetalleElementoComponent } from '../detalle-elemento/detalle-elemento.component';
import { ElementoDiagramaComponent } from '../elemento-diagrama/elemento-diagrama.component';
import { MensajeErrorComponent } from '../mensaje-error/mensaje-error.component';

// Medidas en pixeles para ubicar los elementos
const ANCHO_TITULO = 120;
const ANCHO_NODO = 100;
const ALTO_NODO = 50;
const ALTO_FILA = 90;
const ALTO_CABECERA = 28;
const SEPARACION_POOLS = 24;
// La posicion X del backend se separa un poco para que las flechas no queden tan cortas
const ESCALA_X = 1.5;
// Mitad del tamaño del circulo y del rombo (deben coincidir con elemento-diagrama.component.css)
const RADIO_EVENTO = 12;
const RADIO_GATEWAY = 16;

interface DatosDiagrama {
  proceso: ProcesoResponse;
  pools: PoolResponse[];
  lanes: LaneResponse[][];
  actividades: ActividadResponse[];
  gateways: GatewayResponse[];
  eventos: EventoResponse[];
  arcos: ArcoResponse[];
  mensajes: MensajeResponse[];
}

@Component({
  selector: 'app-diagrama',
  imports: [RouterLink, MensajeErrorComponent, ElementoDiagramaComponent, DetalleElementoComponent],
  templateUrl: './diagrama.component.html',
  styleUrl: './diagrama.component.css'
})
export class DiagramaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private procesoService = inject(ProcesoService);
  private poolService = inject(PoolService);
  private laneService = inject(LaneService);
  private actividadService = inject(ActividadService);
  private gatewayService = inject(GatewayService);
  private eventoService = inject(EventoService);
  private arcoService = inject(ArcoService);
  private mensajeService = inject(MensajeService);

  readonly anchoTitulo = ANCHO_TITULO;

  procesoId: number = 0;
  estado = signal<EstadoPantalla>('idle');
  error = signal<ErrorDto | null>(null);
  proceso = signal<ProcesoResponse | null>(null);

  pools = signal<PoolDiagrama[]>([]);
  nodos = signal<NodoDiagrama[]>([]);
  lineas = signal<LineaDiagrama[]>([]);
  ancho = signal<number>(800);
  alto = signal<number>(200);

  private arcos: ArcoResponse[] = [];
  private mensajes: MensajeResponse[] = [];
  private lanes: LaneResponse[] = [];
  private ubicados: NodoDiagrama[] = [];

  seleccionado = signal<NodoDiagrama | null>(null);

  conexionesSeleccionado = computed<string[]>(() => {
    const nodo: NodoDiagrama | null = this.seleccionado();
    return nodo === null ? [] : this.describirConexiones(nodo);
  });

  nombreLaneSeleccionado = computed<string>(() => {
    const nodo: NodoDiagrama | null = this.seleccionado();
    const lane: LaneResponse | undefined = this.lanes.find(l => l.id === nodo?.laneId);
    return lane ? lane.nombreRol : 'Sin lane';
  });

  ngOnInit(): void {
    this.procesoId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar();
  }

  cargar(): void {
    this.estado.set('loading');
    this.error.set(null);
    this.seleccionado.set(null);

    // Primero los pools, porque las lanes se piden por pool. Lo demas se pide al mismo tiempo.
    this.poolService.listar(this.procesoId).pipe(
      switchMap((pools: PoolResponse[]) => {
        const lanesPorPool: Observable<LaneResponse[][]> = pools.length > 0
          ? forkJoin(pools.map(pool => this.laneService.listar(this.procesoId, pool.id)))
          : of([]);
        return forkJoin({
          proceso: this.procesoService.obtener(this.procesoId),
          pools: of(pools),
          lanes: lanesPorPool,
          actividades: this.actividadService.listar(this.procesoId),
          gateways: this.gatewayService.listar(this.procesoId),
          eventos: this.eventoService.listar(this.procesoId),
          arcos: this.arcoService.listar(this.procesoId),
          mensajes: this.mensajeService.listar(this.procesoId)
        });
      })
    ).subscribe({
      next: (datos: DatosDiagrama) => {
        this.proceso.set(datos.proceso);
        this.armarDiagrama(datos);
        this.estado.set('success');
      },
      error: (error: ErrorDto) => {
        this.error.set(error);
        this.estado.set('error');
      }
    });
  }

  seleccionar(nodo: NodoDiagrama): void {
    this.seleccionado.set(nodo);
  }

  private armarDiagrama(datos: DatosDiagrama): void {
    this.arcos = datos.arcos;
    this.mensajes = datos.mensajes;
    this.lanes = datos.lanes.flat();

    const nodos: NodoDiagrama[] = [
      ...datos.actividades.map(a => this.crearNodo(a.id, 'ACTIVIDAD', a.nombre, a.tipoActividad, a.poolId,
        a.laneId, a.posicionX, [])),
      ...datos.gateways.map(g => this.crearNodo(g.id, 'GATEWAY', g.nombre, g.tipoGateway, g.poolId,
        null, g.posicionX, g.advertencias)),
      ...datos.eventos.map(e => this.crearNodo(e.id, 'EVENTO', e.nombre, this.subtipoEvento(e), e.poolId,
        e.laneId, e.posicionX, e.advertencias))
    ];

    const pools: PoolDiagrama[] = [];
    let y: number = 0;
    const ordenados: PoolResponse[] = [...datos.pools].sort((a, b) => a.orden - b.orden);

    ordenados.forEach(pool => {
      const indice: number = datos.pools.indexOf(pool);
      const lanesDelPool: LaneResponse[] = [...(datos.lanes[indice] ?? [])].sort((a, b) => a.orden - b.orden);
      const nodosDelPool: NodoDiagrama[] = nodos.filter(n => n.poolId === pool.id);

      const filas: FilaDiagrama[] = lanesDelPool.map(lane => ({ laneId: lane.id, titulo: lane.nombreRol, y: 0 }));
      // Los gateways no tienen lane: van en una fila aparte al final del pool
      const idsLanes: number[] = lanesDelPool.map(lane => lane.id);
      if (nodosDelPool.some(n => n.laneId === null || !idsLanes.includes(n.laneId))) {
        filas.push({ laneId: null, titulo: 'Sin lane', y: 0 });
      }

      filas.forEach((fila, i) => {
        fila.y = y + ALTO_CABECERA + i * ALTO_FILA;
        const enFila: NodoDiagrama[] = nodosDelPool
          .filter(n => fila.laneId === null ? (n.laneId === null || !idsLanes.includes(n.laneId)) : n.laneId === fila.laneId)
          .sort((a, b) => a.posicionX - b.posicionX);
        this.ubicarEnFila(enFila, fila.y);
      });

      const alto: number = ALTO_CABECERA + Math.max(filas.length, 1) * ALTO_FILA;
      pools.push({ id: pool.id, nombre: pool.nombre, y: y, alto: alto, filas: filas });
      y += alto + SEPARACION_POOLS;
    });

    const derecha: number = Math.max(0, ...nodos.map(n => n.x + ANCHO_NODO));
    this.ancho.set(Math.max(800, derecha + 40));
    this.alto.set(Math.max(200, y));
    this.pools.set(pools);
    this.nodos.set(nodos);
    this.lineas.set(this.crearLineas(nodos, pools));
  }

  private crearNodo(id: number, tipo: NodoDiagrama['tipo'], nombre: string, subtipo: string, poolId: number,
                    laneId: number | null, posicionX: number, advertencias: string[]): NodoDiagrama {
    return { id, tipo, nombre, subtipo, poolId, laneId, posicionX, advertencias, x: 0, y: 0 };
  }

  private subtipoEvento(evento: EventoResponse): string {
    if (evento.disparador === DisparadorEvento.NINGUNO) {
      return evento.tipoEvento;
    }
    return `${evento.tipoEvento} ${evento.disparador}`;
  }

  // La posicion X del backend decide el orden; si dos elementos quedan encima, se corre el segundo
  private ubicarEnFila(nodos: NodoDiagrama[], yFila: number): void {
    let minimo: number = ANCHO_TITULO + 20;
    nodos.forEach(nodo => {
      nodo.x = Math.max(ANCHO_TITULO + 20 + nodo.posicionX * ESCALA_X, minimo);
      nodo.y = yFila + (ALTO_FILA - ALTO_NODO) / 2;
      minimo = nodo.x + ANCHO_NODO + 40;
    });
  }

  private crearLineas(nodos: NodoDiagrama[], pools: PoolDiagrama[]): LineaDiagrama[] {
    this.ubicados = nodos;
    const porId = new Map<number, NodoDiagrama>(nodos.map(n => [n.id, n]));
    const lineas: LineaDiagrama[] = [];

    // Cada punta del rombo (arriba o abajo) la usa solo la salida hacia el destino mas cercano
    const puntasUsadas = new Set<string>();
    const ordenados: ArcoResponse[] = [...this.arcos]
      .sort((a, b) => (porId.get(a.destinoId)?.x ?? 0) - (porId.get(b.destinoId)?.x ?? 0));

    ordenados.forEach(arco => {
      const origen: NodoDiagrama | undefined = porId.get(arco.origenId);
      const destino: NodoDiagrama | undefined = porId.get(arco.destinoId);
      if (origen && destino) {
        const punta: string = `${origen.id}-${destino.y < origen.y ? 'arriba' : 'abajo'}`;
        const usarPunta: boolean = !puntasUsadas.has(punta);
        puntasUsadas.add(punta);
        lineas.push(this.unirArco(origen, destino, arco.condicion ?? arco.etiqueta, usarPunta));
      }
    });

    this.mensajes.forEach(mensaje => {
      const envio: NodoDiagrama | undefined = porId.get(mensaje.eventoEnvioId);
      if (!envio) {
        return;
      }
      const recepcion: NodoDiagrama | undefined =
        mensaje.eventoRecepcionId !== null ? porId.get(mensaje.eventoRecepcionId) : undefined;
      if (recepcion) {
        lineas.push(this.unirMensaje(envio, recepcion, mensaje.nombre));
      } else {
        // Destino de caja negra: la linea llega al borde del pool destino
        const pool: PoolDiagrama | undefined = pools.find(p => p.id === mensaje.poolDestinoId);
        if (pool) {
          const x: number = envio.x + ANCHO_NODO / 2;
          const yBorde: number = pool.y > envio.y ? pool.y : pool.y + pool.alto;
          const yEnvio: number = pool.y > envio.y ? envio.y + ALTO_NODO : envio.y;
          lineas.push(this.linea('mensaje', [[x, yEnvio], [x, yBorde]], x + 6, (yEnvio + yBorde) / 2, mensaje.nombre));
        }
      }
    });

    return lineas;
  }

  // Distancia del centro al borde de la figura: la actividad ocupa toda la caja, el resto es mas pequeño
  private radio(nodo: NodoDiagrama): { ancho: number; alto: number } {
    if (nodo.tipo === 'ACTIVIDAD') {
      return { ancho: ANCHO_NODO / 2, alto: ALTO_NODO / 2 };
    }
    const r: number = nodo.tipo === 'GATEWAY' ? RADIO_GATEWAY : RADIO_EVENTO;
    return { ancho: r, alto: r };
  }

  // Arco en angulo recto: sale por la derecha del origen y entra por la izquierda del destino
  private unirArco(origen: NodoDiagrama, destino: NodoDiagrama, texto: string | null,
                   usarPunta: boolean): LineaDiagrama {
    const cxO: number = origen.x + ANCHO_NODO / 2;
    const cyO: number = origen.y + ALTO_NODO / 2;
    const cxD: number = destino.x + ANCHO_NODO / 2;
    const cyD: number = destino.y + ALTO_NODO / 2;
    const rO = this.radio(origen);
    const rD = this.radio(destino);

    if (destino.x >= origen.x + ANCHO_NODO) {
      const x2: number = cxD - rD.ancho;

      // Un gateway hacia otra fila sale por la punta de arriba o de abajo del rombo
      if (origen.tipo === 'GATEWAY' && cyO !== cyD) {
        if (usarPunta) {
          const punta: number = cyD < cyO ? cyO - rO.alto : cyO + rO.alto;
          return this.linea('arco', [[cxO, punta], [cxO, cyD], [x2, cyD]], cxO + 14, (punta + cyD) / 2, texto);
        }
        // La punta ya esta ocupada: sale por la derecha y sube o baja justo antes del destino
        const x1: number = cxO + rO.ancho;
        return this.linea('arco', [[x1, cyO], [x2 - 20, cyO], [x2 - 20, cyD], [x2, cyD]], x1 + 16, cyO - 5, texto);
      }

      const x1: number = cxO + rO.ancho;
      if (cyO === cyD) {
        // Si hay otro elemento en medio, la flecha pasa por encima de el
        if (this.hayElementoEntre(origen, destino)) {
          const arriba: number = origen.y - 8;
          return this.linea('arco', [[x1, cyO], [x1 + 12, cyO], [x1 + 12, arriba], [x2 - 12, arriba], [x2 - 12, cyD], [x2, cyD]],
            (x1 + x2) / 2, arriba - 4, texto);
        }
        const textoX: number = origen.tipo === 'GATEWAY' ? x1 + 16 : (x1 + x2) / 2;
        return this.linea('arco', [[x1, cyO], [x2, cyD]], textoX, cyO - 5, texto);
      }
      const quiebre: number = (x1 + x2) / 2;
      return this.linea('arco', [[x1, cyO], [quiebre, cyO], [quiebre, cyD], [x2, cyD]],
        quiebre + 10, (cyO + cyD) / 2, texto);
    }

    // Uno encima del otro: la flecha baja o sube derecho
    if (Math.abs(destino.x - origen.x) < ANCHO_NODO) {
      const baja: boolean = cyD > cyO;
      const inicio: number = baja ? cyO + rO.alto : cyO - rO.alto;
      const fin: number = baja ? cyD - rD.alto : cyD + rD.alto;
      const medio: number = (inicio + fin) / 2;
      return this.linea('arco', [[cxO, inicio], [cxO, medio], [cxD, medio], [cxD, fin]], cxO + 10, medio - 4, texto);
    }

    // El destino esta atras: la flecha pasa por debajo y regresa
    const abajo: number = Math.max(origen.y, destino.y) + ALTO_NODO + 15;
    return this.linea('arco', [[cxO, cyO + rO.alto], [cxO, abajo], [cxD, abajo], [cxD, cyD + rD.alto]],
      (cxO + cxD) / 2, abajo - 4, texto);
  }

  private hayElementoEntre(origen: NodoDiagrama, destino: NodoDiagrama): boolean {
    return this.ubicados.some(n => n.y === origen.y && n.x > origen.x && n.x < destino.x);
  }

  // Mensaje entre pools: baja (o sube) del evento que envia al que recibe
  private unirMensaje(envio: NodoDiagrama, recepcion: NodoDiagrama, texto: string): LineaDiagrama {
    const x1: number = envio.x + ANCHO_NODO / 2;
    const x2: number = recepcion.x + ANCHO_NODO / 2;
    const baja: boolean = recepcion.y > envio.y;
    const inicio: number = envio.y + ALTO_NODO / 2 + (baja ? RADIO_EVENTO : -RADIO_EVENTO);
    const fin: number = recepcion.y + ALTO_NODO / 2 + (baja ? -RADIO_EVENTO : RADIO_EVENTO);
    const medio: number = (inicio + fin) / 2;
    return this.linea('mensaje', [[x1, inicio], [x1, medio], [x2, medio], [x2, fin]], (x1 + x2) / 2, medio - 4, texto);
  }

  private linea(tipo: LineaDiagrama['tipo'], puntos: number[][], textoX: number, textoY: number,
                texto: string | null): LineaDiagrama {
    return { tipo, puntos: puntos.map(p => p.join(',')).join(' '), textoX, textoY, texto };
  }

  private describirConexiones(nodo: NodoDiagrama): string[] {
    const nombre = (id: number): string => this.nodos().find(n => n.id === id)?.nombre ?? `elemento ${id}`;
    const conexiones: string[] = [];

    this.arcos.filter(a => a.origenId === nodo.id).forEach(a => {
      const condicion: string = a.condicion ? ` si "${a.condicion}"` : '';
      conexiones.push(`Va a ${nombre(a.destinoId)}${condicion}`);
    });
    this.arcos.filter(a => a.destinoId === nodo.id).forEach(a => {
      conexiones.push(`Viene de ${nombre(a.origenId)}`);
    });
    this.mensajes.filter(m => m.eventoEnvioId === nodo.id).forEach(m => {
      conexiones.push(`Envía el mensaje "${m.nombre}"`);
    });
    this.mensajes.filter(m => m.eventoRecepcionId === nodo.id).forEach(m => {
      conexiones.push(`Recibe el mensaje "${m.nombre}"`);
    });
    return conexiones;
  }
}
