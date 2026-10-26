import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ErrorDto } from '../../model/error-dto';
import { EstadoPantalla } from '../../model/estado-pantalla';
import { LaneResponse } from '../../model/lane';
import { LaneService } from '../../service/lane.service';
import { MensajeErrorComponent } from '../mensaje-error/mensaje-error.component';

// Lanes (carriles) de un pool: cada lane representa un rol de proceso
@Component({
  selector: 'app-lane-lista',
  imports: [RouterLink, MensajeErrorComponent],
  templateUrl: './lane-lista.component.html'
})
export class LaneListaComponent implements OnInit {
  procesoId: number = 0;
  poolId: number = 0;
  lanes = signal<LaneResponse[]>([]);
  error = signal<ErrorDto | null>(null);
  estado = signal<EstadoPantalla>('idle');

  private readonly laneService = inject(LaneService);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.procesoId = Number(this.route.snapshot.paramMap.get('procesoId'));
    this.poolId = Number(this.route.snapshot.paramMap.get('poolId'));
    this.cargar();
  }

  cargar(): void {
    this.estado.set('loading');
    this.error.set(null);
    this.laneService.listar(this.procesoId, this.poolId).subscribe({
      next: (lanes: LaneResponse[]) => {
        this.lanes.set(lanes);
        this.estado.set('success');
      },
      error: (error: ErrorDto) => {
        this.error.set(error);
        this.estado.set('error');
      }
    });
  }

  eliminar(lane: LaneResponse): void {
    if (!confirm(`¿Eliminar la lane del rol "${lane.nombreRol}"?`)) {
      return;
    }
    this.laneService.eliminar(this.procesoId, this.poolId, lane.id).subscribe({
      next: () => this.cargar(),
      error: (error: ErrorDto) => this.error.set(error)
    });
  }
}
