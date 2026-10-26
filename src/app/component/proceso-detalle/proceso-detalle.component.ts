import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ErrorDto } from '../../model/error-dto';
import { EstadoPantalla } from '../../model/estado-pantalla';
import { HistorialResponse, ProcesoResponse } from '../../model/proceso';
import { ProcesoService } from '../../service/proceso.service';
import { MensajeErrorComponent } from '../mensaje-error/mensaje-error.component';

@Component({
  selector: 'app-proceso-detalle',
  imports: [RouterLink, DatePipe, MensajeErrorComponent],
  templateUrl: './proceso-detalle.component.html'
})
export class ProcesoDetalleComponent implements OnInit {
  estado = signal<EstadoPantalla>('idle');
  proceso = signal<ProcesoResponse | null>(null);
  historial = signal<HistorialResponse[]>([]);
  error = signal<ErrorDto | null>(null);

  private readonly procesoService = inject(ProcesoService);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const id: number = Number(this.route.snapshot.paramMap.get('id'));

    this.estado.set('loading');
    this.procesoService.obtener(id).subscribe({
      next: (proceso: ProcesoResponse) => {
        this.proceso.set(proceso);
        this.estado.set('success');
      },
      error: (error: ErrorDto) => {
        this.error.set(error);
        this.estado.set('error');
      }
    });

    this.procesoService.obtenerHistorial(id).subscribe({
      next: (historial: HistorialResponse[]) => this.historial.set(historial),
      error: (error: ErrorDto) => this.error.set(error)
    });
  }
}
