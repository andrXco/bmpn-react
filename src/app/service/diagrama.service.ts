import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DatosDiagrama } from '../model/diagrama';
import { LaneResponse } from '../model/lane';
import { PoolResponse } from '../model/pool';
import { ActividadService } from './actividad.service';
import { ArcoService } from './arco.service';
import { EventoService } from './evento.service';
import { GatewayService } from './gateway.service';
import { LaneService } from './lane.service';
import { MensajeService } from './mensaje.service';
import { PoolService } from './pool.service';
import { ProcesoService } from './proceso.service';

// Junta en una sola respuesta todo lo que se necesita para dibujar el diagrama de un proceso
@Injectable({
  providedIn: 'root'
})
export class DiagramaService {
  constructor(
    private procesoService: ProcesoService,
    private poolService: PoolService,
    private laneService: LaneService,
    private actividadService: ActividadService,
    private gatewayService: GatewayService,
    private eventoService: EventoService,
    private arcoService: ArcoService,
    private mensajeService: MensajeService
  ) {}

  // Primero se piden los pools, porque las lanes se piden por pool; lo demas se pide al mismo tiempo
  cargar(procesoId: number): Observable<DatosDiagrama> {
    return this.poolService.listar(procesoId).pipe(
      switchMap((pools: PoolResponse[]) => {
        const lanesPorPool: Observable<LaneResponse[][]> = pools.length > 0
          ? forkJoin(pools.map(pool => this.laneService.listar(procesoId, pool.id)))
          : of([]);
        return forkJoin({
          proceso: this.procesoService.obtener(procesoId),
          pools: of(pools),
          lanes: lanesPorPool,
          actividades: this.actividadService.listar(procesoId),
          gateways: this.gatewayService.listar(procesoId),
          eventos: this.eventoService.listar(procesoId),
          arcos: this.arcoService.listar(procesoId),
          mensajes: this.mensajeService.listar(procesoId)
        });
      })
    );
  }
}
