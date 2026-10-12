import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ErrorDto } from '../../model/error-dto';
import { EstadoPantalla } from '../../model/estado-pantalla';
import { LaneResponse } from '../../model/lane';
import { Pagina } from '../../model/pagina';
import { RolProcesoResponse } from '../../model/rol-proceso';
import { LaneService } from '../../service/lane.service';
import { RolProcesoService } from '../../service/rol-proceso.service';
import { campoInvalido } from '../../util/formularios';
import { MensajeErrorComponent } from '../mensaje-error/mensaje-error.component';

// Crea o edita una lane. La lane se asocia a un rol de proceso (ver «Roles de proceso»)
@Component({
  selector: 'app-lane-form',
  imports: [ReactiveFormsModule, RouterLink, MensajeErrorComponent],
  templateUrl: './lane-form.component.html'
})
export class LaneFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private laneService = inject(LaneService);
  private rolProcesoService = inject(RolProcesoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  procesoId: number = 0;
  poolId: number = 0;
  // null = creando; con valor = editando
  laneId: number | null = null;

  form = this.fb.nonNullable.group({
    rolProcesoId: this.fb.control<number | null>(null, [Validators.required])
  });

  roles = signal<RolProcesoResponse[]>([]);
  estado = signal<EstadoPantalla>('idle');
  error = signal<ErrorDto | null>(null);

  campoInvalido = campoInvalido;

  ngOnInit(): void {
    this.procesoId = Number(this.route.snapshot.paramMap.get('procesoId'));
    this.poolId = Number(this.route.snapshot.paramMap.get('poolId'));
    const laneIdTexto: string | null = this.route.snapshot.paramMap.get('laneId');
    this.laneId = laneIdTexto === null ? null : Number(laneIdTexto);

    this.estado.set('loading');
    // Roles activos de la empresa (hasta 100) para el selector
    this.rolProcesoService.listar({ nombre: '', incluirInactivos: false, page: 0, size: 100 }).subscribe({
      next: (pagina: Pagina<RolProcesoResponse>) => {
        this.roles.set(pagina.content);
        this.estado.set('idle');
        if (this.laneId !== null) {
          this.cargarLane(this.laneId);
        }
      },
      error: (error: ErrorDto) => {
        this.error.set(error);
        this.estado.set('error');
      }
    });
  }

  // El backend no tiene GET de una lane: se busca en la lista del pool
  private cargarLane(laneId: number): void {
    this.laneService.listar(this.procesoId, this.poolId).subscribe({
      next: (lanes: LaneResponse[]) => {
        const lane: LaneResponse | undefined = lanes.find((l: LaneResponse) => l.id === laneId);
        if (lane === undefined) {
          this.error.set({
            codigo: 'RECURSO_NO_ENCONTRADO',
            mensaje: 'Lane no encontrada en el pool',
            fecha: new Date().toISOString(),
            detalles: []
          });
          this.estado.set('error');
          return;
        }
        this.form.patchValue({ rolProcesoId: lane.rolProcesoId });
      },
      error: (error: ErrorDto) => {
        this.error.set(error);
        this.estado.set('error');
      }
    });
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const solicitud = { rolProcesoId: Number(this.form.controls.rolProcesoId.value) };
    this.estado.set('loading');
    this.error.set(null);

    const peticion =
      this.laneId === null
        ? this.laneService.crear(this.procesoId, this.poolId, solicitud)
        : this.laneService.editar(this.procesoId, this.poolId, this.laneId, solicitud);

    peticion.subscribe({
      next: () => {
        this.estado.set('success');
        this.router.navigate(['/procesos', this.procesoId, 'pools', this.poolId, 'lanes']);
      },
      error: (error: ErrorDto) => {
        this.error.set(error);
        this.estado.set('error');
      }
    });
  }
}
