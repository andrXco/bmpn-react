import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import Modeler from 'bpmn-js/lib/Modeler';
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import { Observable, firstValueFrom, forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ActividadResponse, TipoActividad } from '../../model/actividad';
import { AdvertenciasResponse } from '../../model/advertencias';
import { ArcoRequest, ArcoResponse } from '../../model/arco';
import { DatosDiagrama, NodoDiagrama, TipoNodo } from '../../model/diagrama';
import { ErrorDto } from '../../model/error-dto';
import { EstadoPantalla } from '../../model/estado-pantalla';
import { DisparadorEvento, EventoResponse, TipoEvento } from '../../model/evento';
import { GatewayResponse, TipoGateway } from '../../model/gateway';
import { LaneResponse } from '../../model/lane';
import { PoolResponse } from '../../model/pool';
import { ProcesoResponse } from '../../model/proceso';
import { RolAcceso } from '../../model/rol-acceso';
import { ActividadService } from '../../service/actividad.service';
import { ArcoService } from '../../service/arco.service';
import { EventoService } from '../../service/evento.service';
import { GatewayService } from '../../service/gateway.service';
import { LaneService } from '../../service/lane.service';
import { MensajeService } from '../../service/mensaje.service';
import { PoolService } from '../../service/pool.service';
import { ProcesoService } from '../../service/proceso.service';
import { UsuarioActivoService } from '../../service/usuario-activo.service';
import {
  MARGEN_X, generarXml, idActividad, idArco, idEvento, idGateway, idMensaje, numeroDeId
} from '../../util/bpmn-xml';
import { DetalleElementoComponent } from '../detalle-elemento/detalle-elemento.component';
import { MensajeErrorComponent } from '../mensaje-error/mensaje-error.component';

// Elemento de bpmn-js (forma o flecha). Solo se usan estos campos.
interface ElementoBpmn {
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

@Component({
  selector: 'app-diagrama',
  imports: [RouterLink, MensajeErrorComponent, DetalleElementoComponent],
  templateUrl: './diagrama.component.html',
  styleUrl: './diagrama.component.css'
})
export class DiagramaComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('lienzo', { static: true }) lienzo!: ElementRef<HTMLDivElement>;

  private route = inject(ActivatedRoute);
  private procesoService = inject(ProcesoService);
  private poolService = inject(PoolService);
  private laneService = inject(LaneService);
  private actividadService = inject(ActividadService);
  private gatewayService = inject(GatewayService);
  private eventoService = inject(EventoService);
  private arcoService = inject(ArcoService);
  private mensajeService = inject(MensajeService);
  private usuarioActivo = inject(UsuarioActivoService);

  procesoId: number = 0;
  // Un usuario de solo lectura ve el diagrama pero no lo puede modificar (HU-24)
  soloLectura: boolean = false;
  estado = signal<EstadoPantalla>('idle');
  error = signal<ErrorDto | null>(null);
  advertencias = signal<string[]>([]);
  proceso = signal<ProcesoResponse | null>(null);

  seleccionado = signal<NodoDiagrama | null>(null);
  nombreLane = signal<string>('Sin lane');
  conexiones = signal<string[]>([]);

  // Modeler para editar; NavigatedViewer solo deja mover la vista y hacer zoom
  private modeler!: Modeler | NavigatedViewer;
  private primeraCarga: boolean = true;
  // Mientras bpmn-js cambia el tipo de un elemento, se ignoran los pasos internos que hace
  private reemplazando: boolean = false;
  // Las peticiones al backend van una detras de otra, en el mismo orden en que se hicieron en el diagrama
  private cola: Promise<void> = Promise.resolve();

  private pools = new Map<number, PoolResponse>();
  private actividades = new Map<number, ActividadResponse>();
  private gateways = new Map<number, GatewayResponse>();
  private eventos = new Map<number, EventoResponse>();
  private arcos = new Map<number, ArcoResponse>();

  ngOnInit(): void {
    this.procesoId = Number(this.route.snapshot.paramMap.get('id'));
    this.soloLectura = this.usuarioActivo.sesion?.rolAcceso === RolAcceso.SOLO_LECTURA;
  }

  ngAfterViewInit(): void {
    if (this.soloLectura) {
      this.modeler = new NavigatedViewer({ container: this.lienzo.nativeElement });
      // Se puede seleccionar un elemento para ver su detalle, pero no hay paleta ni cambios que guardar
      this.modeler.get<any>('eventBus').on('selection.changed', (e: any) => {
        this.alSeleccionar(e.newSelection);
      });
    } else {
      this.modeler = new Modeler({ container: this.lienzo.nativeElement });
      this.escucharCambios();
    }
    this.cargar();
  }

  ngOnDestroy(): void {
    this.modeler?.destroy();
  }

  cargar(): void {
    this.estado.set('loading');
    this.seleccionado.set(null);

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
      next: (datos: DatosDiagrama) => this.dibujar(datos),
      error: (error: ErrorDto) => {
        this.error.set(error);
        this.estado.set('error');
      }
    });
  }

  private async dibujar(datos: DatosDiagrama): Promise<void> {
    this.proceso.set(datos.proceso);
    this.pools = new Map(datos.pools.map(p => [p.id, p]));
    this.actividades = new Map(datos.actividades.map(a => [a.id, a]));
    this.gateways = new Map(datos.gateways.map(g => [g.id, g]));
    this.eventos = new Map(datos.eventos.map(e => [e.id, e]));
    this.arcos = new Map(datos.arcos.map(a => [a.id, a]));
    try {
      await this.modeler.importXML(generarXml(datos));
      if (this.primeraCarga) {
        // Se ajusta al espacio disponible y se corre a la derecha para que la paleta no tape las lanes
        const canvas = this.modeler.get<any>('canvas');
        canvas.zoom('fit-viewport');
        canvas.zoom(canvas.zoom() * 0.85);
        canvas.scroll({ dx: 100, dy: 10 });
        this.primeraCarga = false;
      }
      this.estado.set('success');
    } catch {
      this.error.set(this.errorLocal('No fue posible dibujar el diagrama.'));
      this.estado.set('error');
    }
  }

  private escucharCambios(): void {
    const eventos = this.modeler.get<any>('eventBus');
    eventos.on('commandStack.shape.replace.preExecute', () => this.reemplazando = true);
    eventos.on('commandStack.shape.replace.postExecuted', (e: any) => {
      this.reemplazando = false;
      this.alReemplazar(e.context.oldShape, e.context.newShape);
    });
    eventos.on('commandStack.shape.create.postExecuted', (e: any) => this.alCrear(e.context.shape));
    eventos.on('commandStack.connection.create.postExecuted', (e: any) => this.alConectar(e.context.connection));
    eventos.on('commandStack.connection.reconnect.postExecuted', (e: any) => this.alReconectar(e.context.connection));
    eventos.on('commandStack.elements.move.postExecuted', (e: any) => this.alMover(e.context.shapes));
    eventos.on('commandStack.elements.delete.postExecuted', (e: any) => this.alEliminar(e.context.elements));
    eventos.on('commandStack.element.updateLabel.postExecuted', (e: any) =>
      this.alRenombrar(e.context.element, e.context.newLabel));
    eventos.on('selection.changed', (e: any) => this.alSeleccionar(e.newSelection));
  }

  // ---- Lo que pasa en el diagrama y como se guarda en el backend ----

  private alCrear(forma: ElementoBpmn): void {
    if (this.reemplazando || forma.type === 'label') {
      return;
    }
    const tipo: TipoNodo | null = this.tipoDe(forma);
    this.enCola(async () => {
      if (tipo === null) {
        throw this.errorLocal('Ese elemento no se maneja en este editor.');
      }
      const poolId: number = this.poolIdDe(forma);
      const ubicacion = this.ubicacionDe(forma);
      const nombre: string = forma.businessObject.name ?? '';

      if (tipo === 'ACTIVIDAD') {
        if (ubicacion.laneId === null) {
          throw this.errorLocal('Una actividad debe quedar dentro de una lane.');
        }
        const creada: ActividadResponse = await firstValueFrom(this.actividadService.crear(this.procesoId, {
          nombre: nombre || this.nombreLibre(), tipoActividad: this.tipoActividadDe(forma),
          posicionX: ubicacion.posicionX, posicionY: ubicacion.posicionY, laneId: ubicacion.laneId, poolId
        }));
        this.actividades.set(creada.id, creada);
        this.cambiarId(forma, idActividad(creada.id), creada.nombre);
      } else if (tipo === 'GATEWAY') {
        const creado: GatewayResponse = await firstValueFrom(this.gatewayService.crear(this.procesoId, {
          nombre: nombre || 'Gateway', tipoGateway: this.tipoGatewayDe(forma),
          posicionX: ubicacion.posicionX, posicionY: ubicacion.posicionY, poolId
        }));
        this.gateways.set(creado.id, creado);
        this.cambiarId(forma, idGateway(creado.id), creado.nombre);
      } else {
        const evento = this.eventoDe(forma);
        const creado: EventoResponse = await firstValueFrom(this.eventoService.crear(this.procesoId, {
          nombre: nombre || 'Evento', tipoEvento: evento.tipoEvento, disparador: evento.disparador, origenExterno: false,
          posicionX: ubicacion.posicionX, posicionY: ubicacion.posicionY, poolId, laneId: ubicacion.laneId
        }));
        this.eventos.set(creado.id, creado);
        this.cambiarId(forma, idEvento(creado.id), creado.nombre);
      }
    });
  }

  private alConectar(flecha: ElementoBpmn): void {
    if (this.reemplazando) {
      return;
    }
    this.enCola(async () => {
      const origen: ElementoBpmn = flecha.source as ElementoBpmn;
      const destino: ElementoBpmn = flecha.target as ElementoBpmn;
      if (flecha.type === 'bpmn:SequenceFlow') {
        const creado: ArcoResponse = await firstValueFrom(this.arcoService.crear(this.procesoId, {
          origenId: this.numeroDe(origen), destinoId: this.numeroDe(destino), etiqueta: null, condicion: null
        }));
        this.arcos.set(creado.id, creado);
        this.cambiarId(flecha, idArco(creado.id));
      } else if (flecha.type === 'bpmn:MessageFlow') {
        const eventoEnvioId: number | null = numeroDeId(origen.id, 'Evento');
        if (eventoEnvioId === null) {
          throw this.errorLocal('Un mensaje sale de un evento que envía mensajes.');
        }
        const creado = await firstValueFrom(this.mensajeService.crear(this.procesoId, {
          eventoEnvioId,
          eventoRecepcionId: numeroDeId(destino.id, 'Evento'),
          poolDestinoId: destino.type === 'bpmn:Participant' ? this.numeroPool(destino) : this.poolIdDe(destino),
          nombre: flecha.businessObject.name || 'Mensaje',
          claveCorrelacion: null, politicaSinCorrespondencia: null, politicaFallo: null, campos: []
        }));
        this.cambiarId(flecha, idMensaje(creado.id), creado.nombre);
        this.advertencias.set(creado.advertencias);
      } else {
        throw this.errorLocal('Esa conexión no se maneja en este editor.');
      }
    });
  }

  private alReconectar(flecha: ElementoBpmn): void {
    if (this.reemplazando) {
      return;
    }
    this.enCola(async () => {
      const id: number | null = numeroDeId(flecha.id, 'Arco');
      if (id === null) {
        throw this.errorLocal('Ese mensaje no se puede reconectar; elimínalo y créalo de nuevo.');
      }
      await this.guardarArco(id, flecha);
    });
  }

  private alMover(formas: ElementoBpmn[]): void {
    const nodos: ElementoBpmn[] = formas.filter(f => this.tipoDe(f) !== null);
    if (nodos.length === 0) {
      return;
    }
    this.enCola(async () => {
      for (const forma of nodos) {
        const ubicacion = this.ubicacionDe(forma);
        if (this.poolIdDe(forma) !== this.poolOriginal(forma)) {
          throw this.errorLocal('Un elemento no se puede pasar a otro pool.');
        }
        await this.guardarNodo(forma, ubicacion);
      }
    });
  }

  private alRenombrar(elemento: ElementoBpmn, nombre: string): void {
    const objetivo: ElementoBpmn = elemento.labelTarget ?? elemento;
    this.enCola(async () => {
      if (this.tipoDe(objetivo) !== null) {
        await this.guardarNodo(objetivo, this.ubicacionDe(objetivo), nombre);
      } else if (objetivo.type === 'bpmn:SequenceFlow') {
        const id: number | null = numeroDeId(objetivo.id, 'Arco');
        if (id !== null) {
          await this.guardarArco(id, objetivo, nombre);
        }
      } else if (objetivo.type === 'bpmn:Participant') {
        const pool: PoolResponse | undefined = this.pools.get(this.numeroPool(objetivo));
        if (pool) {
          const editado: PoolResponse = await firstValueFrom(this.poolService.editar(this.procesoId, pool.id, {
            nombre: nombre, canalExterno: pool.canalExterno, cajaNegra: pool.cajaNegra
          }));
          this.pools.set(editado.id, editado);
        }
      } else {
        throw this.errorLocal('Ese nombre no se puede cambiar desde el diagrama.');
      }
    });
  }

  // bpmn-js ya quito los elementos del dibujo. Se pregunta despues de que termina (por eso el setTimeout):
  // si el usuario cancela, se deshace el borrado y no se llama al backend.
  private alEliminar(elementos: ElementoBpmn[]): void {
    setTimeout(() => {
      if (!confirm(this.textoConfirmacion(elementos))) {
        this.modeler.get<any>('commandStack').undo();
        return;
      }
      this.borrarEnBackend(elementos);
    });
  }

  private textoConfirmacion(elementos: ElementoBpmn[]): string {
    const nombres: string[] = elementos
      .filter(e => e.type !== 'label')
      .map(e => e.businessObject.name || 'elemento sin nombre');
    if (nombres.length === 1) {
      return `¿Eliminar "${nombres[0]}" del diagrama?`;
    }
    return `¿Eliminar ${nombres.length} elementos del diagrama?`;
  }

  private borrarEnBackend(elementos: ElementoBpmn[]): void {
    const borrados: Set<string> = new Set(elementos.map(e => e.id));
    this.enCola(async () => {
      const avisos: string[] = [];
      for (const elemento of elementos) {
        const tipo: TipoNodo | null = this.tipoDe(elemento);
        let respuesta: AdvertenciasResponse | null = null;
        if (tipo === 'ACTIVIDAD') {
          respuesta = await firstValueFrom(this.actividadService.eliminar(this.procesoId, this.numeroDe(elemento)));
        } else if (tipo === 'GATEWAY') {
          respuesta = await firstValueFrom(this.gatewayService.eliminar(this.procesoId, this.numeroDe(elemento)));
        } else if (tipo === 'EVENTO') {
          respuesta = await firstValueFrom(this.eventoService.eliminar(this.procesoId, this.numeroDe(elemento)));
        } else if (elemento.type === 'bpmn:SequenceFlow' || elemento.type === 'bpmn:MessageFlow') {
          // Si se borro uno de sus extremos, el backend ya la elimino junto con el
          if (borrados.has(elemento.source?.id ?? '') || borrados.has(elemento.target?.id ?? '')) {
            continue;
          }
          const arcoId: number | null = numeroDeId(elemento.id, 'Arco');
          const mensajeId: number | null = numeroDeId(elemento.id, 'Mensaje');
          if (arcoId !== null) {
            respuesta = await firstValueFrom(this.arcoService.eliminar(this.procesoId, arcoId));
          } else if (mensajeId !== null) {
            await firstValueFrom(this.mensajeService.eliminar(this.procesoId, mensajeId));
          }
        } else if (elemento.type !== 'label') {
          throw this.errorLocal('Los pools y las lanes se eliminan desde la pantalla de pools.');
        }
        avisos.push(...(respuesta?.advertencias ?? []));
      }
      this.advertencias.set(avisos);
      this.seleccionado.set(null);
    });
  }

  private alReemplazar(anterior: ElementoBpmn, nueva: ElementoBpmn): void {
    this.enCola(async () => {
      if (this.tipoDe(anterior) === null || this.tipoDe(anterior) !== this.tipoDe(nueva)) {
        throw this.errorLocal('Ese cambio de tipo no se maneja en este editor.');
      }
      // El backend conserva el mismo elemento: solo cambia su tipo
      this.cambiarId(nueva, anterior.id);
      await this.guardarNodo(nueva, this.ubicacionDe(nueva));
    });
  }

  private alSeleccionar(seleccion: ElementoBpmn[]): void {
    const forma: ElementoBpmn | undefined = seleccion.length === 1 ? seleccion[0] : undefined;
    const tipo: TipoNodo | null = forma ? this.tipoDe(forma) : null;
    if (!forma || tipo === null || numeroDeId(forma.id, this.prefijo(tipo)) === null) {
      this.seleccionado.set(null);
      return;
    }
    const id: number = this.numeroDe(forma);
    const nombreDe = (e?: ElementoBpmn): string => e?.businessObject.name || 'elemento sin nombre';
    this.conexiones.set([
      ...(forma.outgoing ?? []).map(f => f.type === 'bpmn:MessageFlow'
        ? `Envía el mensaje "${nombreDe(f)}"` : `Va a ${nombreDe(f.target)}`),
      ...(forma.incoming ?? []).map(f => f.type === 'bpmn:MessageFlow'
        ? `Recibe el mensaje "${nombreDe(f)}"` : `Viene de ${nombreDe(f.source)}`)
    ]);
    this.nombreLane.set(this.laneEn(forma)?.businessObject.name ?? 'Sin lane');
    this.seleccionado.set({
      id, tipo, nombre: nombreDe(forma), subtipo: this.subtipoDe(forma),
      posicionX: this.ubicacionDe(forma).posicionX,
      advertencias: tipo === 'GATEWAY' ? this.gateways.get(id)?.advertencias ?? []
        : tipo === 'EVENTO' ? this.eventos.get(id)?.advertencias ?? [] : [],
      recibeMensaje: tipo === 'EVENTO' && this.eventoDe(forma).disparador === DisparadorEvento.MENSAJE_RECEPCION,
      origenExterno: tipo === 'EVENTO' && (this.eventos.get(id)?.origenExterno ?? false)
    });
  }

  // HU-27: un evento que recibe mensajes puede marcarse de origen externo cuando nadie del proceso se lo envía
  cambiarOrigenExterno(origenExterno: boolean): void {
    const nodo: NodoDiagrama | null = this.seleccionado();
    if (!nodo || nodo.tipo !== 'EVENTO') {
      return;
    }
    this.enCola(async () => {
      const actual: EventoResponse = this.eventos.get(nodo.id) as EventoResponse;
      const editado: EventoResponse = await firstValueFrom(this.eventoService.editar(this.procesoId, nodo.id, {
        nombre: actual.nombre, tipoEvento: actual.tipoEvento, disparador: actual.disparador, origenExterno,
        posicionX: actual.posicionX, posicionY: actual.posicionY, laneId: actual.laneId
      }));
      this.eventos.set(nodo.id, editado);
      this.advertencias.set(editado.advertencias);
      this.seleccionado.set({ ...nodo, origenExterno: editado.origenExterno, advertencias: editado.advertencias });
    });
  }

  // ---- Guardar ----

  private async guardarNodo(forma: ElementoBpmn, ubicacion: { posicionX: number; posicionY: number; laneId: number | null },
                            nombreNuevo?: string): Promise<void> {
    const id: number = this.numeroDe(forma);
    const tipo: TipoNodo | null = this.tipoDe(forma);
    if (tipo === 'ACTIVIDAD') {
      const actual: ActividadResponse = this.actividades.get(id) as ActividadResponse;
      if (ubicacion.laneId === null) {
        throw this.errorLocal('Una actividad debe quedar dentro de una lane.');
      }
      const editada: ActividadResponse = await firstValueFrom(this.actividadService.editar(this.procesoId, id, {
        nombre: nombreNuevo ?? actual.nombre, tipoActividad: this.tipoActividadDe(forma),
        posicionX: ubicacion.posicionX, posicionY: ubicacion.posicionY, laneId: ubicacion.laneId
      }));
      this.actividades.set(id, editada);
    } else if (tipo === 'GATEWAY') {
      const actual: GatewayResponse = this.gateways.get(id) as GatewayResponse;
      const editado: GatewayResponse = await firstValueFrom(this.gatewayService.editar(this.procesoId, id, {
        nombre: nombreNuevo ?? actual.nombre, tipoGateway: this.tipoGatewayDe(forma),
        posicionX: ubicacion.posicionX, posicionY: ubicacion.posicionY
      }));
      this.gateways.set(id, editado);
      this.advertencias.set(editado.advertencias);
    } else if (tipo === 'EVENTO') {
      const actual: EventoResponse = this.eventos.get(id) as EventoResponse;
      const evento = this.eventoDe(forma);
      const editado: EventoResponse = await firstValueFrom(this.eventoService.editar(this.procesoId, id, {
        nombre: nombreNuevo ?? actual.nombre, tipoEvento: evento.tipoEvento, disparador: evento.disparador,
        // Si deja de recibir mensajes ya no puede ser de origen externo; el backend lo rechazaría
        origenExterno: evento.disparador === DisparadorEvento.MENSAJE_RECEPCION && actual.origenExterno,
        posicionX: ubicacion.posicionX, posicionY: ubicacion.posicionY,
        laneId: ubicacion.laneId
      }));
      this.eventos.set(id, editado);
      this.advertencias.set(editado.advertencias);
    }
  }

  // En un arco que sale de un gateway exclusivo o inclusivo, el texto de la flecha es la condicion
  private async guardarArco(id: number, flecha: ElementoBpmn, texto?: string): Promise<void> {
    const origen: ElementoBpmn = flecha.source as ElementoBpmn;
    const valor: string | null = (texto ?? flecha.businessObject.name ?? '').trim() || null;
    const conCondicion: boolean = is(origen, 'bpmn:ExclusiveGateway') || is(origen, 'bpmn:InclusiveGateway');
    const request: ArcoRequest = {
      origenId: this.numeroDe(origen), destinoId: this.numeroDe(flecha.target as ElementoBpmn),
      etiqueta: valor, condicion: conCondicion ? valor : null
    };
    const editado: ArcoResponse = await firstValueFrom(this.arcoService.editar(this.procesoId, id, request));
    this.arcos.set(id, editado);
  }

  private enCola(tarea: () => Promise<void>): void {
    this.cola = this.cola
      .then(() => {
        this.error.set(null);
        return tarea();
      })
      .catch((error: ErrorDto) => {
        // El diagrama vuelve a quedar como esta guardado en el backend
        this.error.set(error?.mensaje ? error : this.errorLocal('No fue posible guardar el cambio.'));
        this.cargar();
      });
  }

  // ---- Utilidades ----

  private tipoDe(elemento: ElementoBpmn): TipoNodo | null {
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

  private prefijo(tipo: TipoNodo): string {
    return tipo === 'ACTIVIDAD' ? 'Actividad' : tipo === 'GATEWAY' ? 'Gateway' : 'Evento';
  }

  private numeroDe(elemento: ElementoBpmn): number {
    const tipo: TipoNodo | null = this.tipoDe(elemento);
    const numero: number | null = tipo ? numeroDeId(elemento.id, this.prefijo(tipo)) : null;
    if (numero === null) {
      throw this.errorLocal('El elemento todavía no está guardado.');
    }
    return numero;
  }

  private tipoActividadDe(forma: ElementoBpmn): TipoActividad {
    if (is(forma, 'bpmn:UserTask')) {
      return TipoActividad.USUARIO;
    }
    if (is(forma, 'bpmn:ManualTask')) {
      return TipoActividad.MANUAL;
    }
    return is(forma, 'bpmn:ServiceTask') ? TipoActividad.SERVICIO : TipoActividad.TAREA;
  }

  private tipoGatewayDe(forma: ElementoBpmn): TipoGateway {
    if (is(forma, 'bpmn:ParallelGateway')) {
      return TipoGateway.PARALELO;
    }
    return is(forma, 'bpmn:InclusiveGateway') ? TipoGateway.INCLUSIVO : TipoGateway.EXCLUSIVO;
  }

  private eventoDe(forma: ElementoBpmn): { tipoEvento: TipoEvento; disparador: DisparadorEvento } {
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

  private subtipoDe(forma: ElementoBpmn): string {
    const tipo: TipoNodo | null = this.tipoDe(forma);
    if (tipo === 'ACTIVIDAD') {
      return this.tipoActividadDe(forma);
    }
    if (tipo === 'GATEWAY') {
      return this.tipoGatewayDe(forma);
    }
    const evento = this.eventoDe(forma);
    return evento.disparador === DisparadorEvento.NINGUNO ? evento.tipoEvento : `${evento.tipoEvento} ${evento.disparador}`;
  }

  private poolDe(elemento: ElementoBpmn): ElementoBpmn | undefined {
    let actual: ElementoBpmn | undefined = elemento.parent;
    while (actual && actual.type !== 'bpmn:Participant') {
      actual = actual.parent;
    }
    return actual;
  }

  private numeroPool(pool: ElementoBpmn): number {
    const numero: number | null = numeroDeId(pool.id, 'Pool');
    if (numero === null) {
      throw this.errorLocal('Los pools se crean desde la pantalla de pools.');
    }
    return numero;
  }

  private poolIdDe(elemento: ElementoBpmn): number {
    const pool: ElementoBpmn | undefined = this.poolDe(elemento);
    if (!pool) {
      throw this.errorLocal('El elemento debe quedar dentro de un pool.');
    }
    return this.numeroPool(pool);
  }

  // Pool en el que estaba el elemento segun el backend
  private poolOriginal(forma: ElementoBpmn): number | undefined {
    const id: number = this.numeroDe(forma);
    const tipo: TipoNodo | null = this.tipoDe(forma);
    return tipo === 'ACTIVIDAD' ? this.actividades.get(id)?.poolId
      : tipo === 'GATEWAY' ? this.gateways.get(id)?.poolId : this.eventos.get(id)?.poolId;
  }

  private laneEn(forma: ElementoBpmn): ElementoBpmn | undefined {
    const pool: ElementoBpmn | undefined = this.poolDe(forma);
    const centroY: number = forma.y + forma.height / 2;
    return this.modeler.get<any>('elementRegistry')
      .filter((e: ElementoBpmn) => e.type === 'bpmn:Lane' && this.poolDe(e) === pool
        && centroY >= e.y && centroY <= e.y + e.height)[0];
  }

  // Centro del elemento medido desde la esquina del pool, igual que en generarXml
  private ubicacionDe(forma: ElementoBpmn): { posicionX: number; posicionY: number; laneId: number | null } {
    const pool: ElementoBpmn | undefined = this.poolDe(forma);
    const redondear = (valor: number): number => Math.round(valor * 100) / 100;
    const lane: ElementoBpmn | undefined = this.laneEn(forma);
    return {
      posicionX: redondear(forma.x + forma.width / 2 - (pool?.x ?? 0) - MARGEN_X),
      posicionY: redondear(forma.y + forma.height / 2 - (pool?.y ?? 0)),
      laneId: lane ? numeroDeId(lane.id, 'Lane') : null
    };
  }

  // El nombre de una actividad no se puede repetir dentro del proceso
  private nombreLibre(): string {
    const usados: string[] = [...this.actividades.values()].map(a => a.nombre.toLowerCase());
    let numero: number = 1;
    while (usados.includes(`nueva actividad ${numero}`)) {
      numero++;
    }
    return `Nueva actividad ${numero}`;
  }

  private cambiarId(elemento: ElementoBpmn, id: string, nombre?: string): void {
    const cambios: { id: string; name?: string } = { id };
    if (nombre && !elemento.businessObject.name) {
      cambios.name = nombre;
    }
    this.modeler.get<any>('modeling').updateProperties(elemento, cambios);
  }

  private errorLocal(mensaje: string): ErrorDto {
    return { codigo: 'DIAGRAMA', mensaje, fecha: new Date().toISOString(), detalles: [] };
  }
}
