import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ErrorDto } from '../../model/error-dto';
import { EstadoPantalla } from '../../model/estado-pantalla';
import { PoolResponse, TipoParticipante } from '../../model/pool';
import { PoolService } from '../../service/pool.service';
import { MensajeErrorComponent } from '../mensaje-error/mensaje-error.component';

@Component({
  selector: 'app-pool-lista',
  imports: [RouterLink, MensajeErrorComponent],
  templateUrl: './pool-lista.component.html'
})
export class PoolListaComponent implements OnInit {
  procesoId: number = 0;
  pools = signal<PoolResponse[]>([]);
  error = signal<ErrorDto | null>(null);
  estado = signal<EstadoPantalla>('idle');
  tipoParticipante: typeof TipoParticipante = TipoParticipante;

  private readonly poolService = inject(PoolService);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.procesoId = Number(this.route.snapshot.paramMap.get('procesoId'));
    this.cargar();
  }

  cargar(): void {
    this.estado.set('loading');
    this.error.set(null);
    this.poolService.listar(this.procesoId).subscribe({
      next: (pools: PoolResponse[]) => {
        this.pools.set(pools);
        this.estado.set('success');
      },
      error: (error: ErrorDto) => {
        this.error.set(error);
        this.estado.set('error');
      }
    });
  }

  eliminar(pool: PoolResponse): void {
    if (!confirm(`¿Eliminar el pool "${pool.nombre}"?`)) {
      return;
    }
    this.poolService.eliminar(this.procesoId, pool.id).subscribe({
      next: () => this.cargar(),
      error: (error: ErrorDto) => this.error.set(error)
    });
  }
}
