import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ErrorDto } from '../../model/error-dto';
import { EstadoPantalla } from '../../model/estado-pantalla';
import { HistorialResponse, ProcesoResponse } from '../../model/proceso';
import { ProcesoService } from '../../service/proceso.service';
import { UsuarioActivoService } from '../../service/usuario-activo.service';
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
  // Falso cuando otra empresa compartió el proceso: solo se puede consultar (HU-23)
  propio = signal<boolean>(true);

  constructor(
    private procesoService: ProcesoService,
    private route: ActivatedRoute,
    readonly usuarioActivo: UsuarioActivoService
  ) {}

  ngOnInit(): void {
    const id: number = Number(this.route.snapshot.paramMap.get('id'));

    this.estado.set('loading');
    this.procesoService.obtener(id).subscribe({
      next: (proceso: ProcesoResponse) => {
        this.proceso.set(proceso);
        this.propio.set(this.usuarioActivo.esDeMiEmpresa(proceso.empresaId));
        this.estado.set('success');
        // El historial muestra usuarios de la empresa dueña, por eso no se comparte
        if (this.propio()) {
          this.cargarHistorial(id);
        }
      },
      error: (error: ErrorDto) => {
        this.error.set(error);
        this.estado.set('error');
      }
    });
  }

  private cargarHistorial(id: number): void {
    this.procesoService.obtenerHistorial(id).subscribe({
      next: (historial: HistorialResponse[]) => this.historial.set(historial),
      error: (error: ErrorDto) => this.error.set(error)
    });
  }
}
