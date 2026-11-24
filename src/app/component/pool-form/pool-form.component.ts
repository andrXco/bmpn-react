import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ErrorDto } from '../../model/error-dto';
import { EstadoPantalla } from '../../model/estado-pantalla';
import { CrearPoolRequest, PoolResponse, TipoParticipante } from '../../model/pool';
import { PoolService } from '../../service/pool.service';
import { campoInvalido } from '../../util/formularios';
import { MensajeErrorComponent } from '../mensaje-error/mensaje-error.component';

@Component({
  selector: 'app-pool-form',
  imports: [ReactiveFormsModule, RouterLink, MensajeErrorComponent],
  templateUrl: './pool-form.component.html'
})
export class PoolFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private poolService = inject(PoolService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  procesoId: number = 0;
  // null = creando; con valor = editando
  poolId: number | null = null;

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    tipoParticipante: this.fb.nonNullable.control<TipoParticipante>(TipoParticipante.CLIENTE),
    empresaParticipanteId: this.fb.control<number | null>(null),
    canalExterno: ['', [Validators.maxLength(100)]],
    cajaNegra: [false]
  });

  // El pool de la empresa propietaria se crea solo con el proceso, por eso no se ofrece al crear
  tiposDisponibles: TipoParticipante[] = [
    TipoParticipante.CLIENTE,
    TipoParticipante.PROVEEDOR,
    TipoParticipante.SISTEMA_EXTERNO
  ];

  estado = signal<EstadoPantalla>('idle');
  error = signal<ErrorDto | null>(null);

  campoInvalido = campoInvalido;

  ngOnInit(): void {
    this.procesoId = Number(this.route.snapshot.paramMap.get('procesoId'));

    // Cuando cambia el tipo, la empresa participante pasa a ser obligatoria u opcional
    this.form.controls.tipoParticipante.valueChanges.subscribe(() => this.actualizarEmpresa());
    this.actualizarEmpresa();

    const poolIdTexto: string | null = this.route.snapshot.paramMap.get('poolId');
    if (poolIdTexto === null) {
      return;
    }

    this.poolId = Number(poolIdTexto);
    this.estado.set('loading');
    this.poolService.obtener(this.procesoId, this.poolId).subscribe({
      next: (pool: PoolResponse) => {
        this.form.patchValue({
          nombre: pool.nombre,
          tipoParticipante: pool.tipoParticipante,
          empresaParticipanteId: pool.empresaParticipanteId,
          canalExterno: pool.canalExterno ?? '',
          cajaNegra: pool.cajaNegra
        });
        this.actualizarEmpresa();
        this.estado.set('idle');
      },
      error: (error: ErrorDto) => {
        this.error.set(error);
        this.estado.set('error');
      }
    });
  }

  // Solo CLIENTE y PROVEEDOR necesitan el id de la empresa participante
  requiereEmpresa(): boolean {
    const tipo: TipoParticipante = this.form.controls.tipoParticipante.value;
    return tipo === TipoParticipante.CLIENTE || tipo === TipoParticipante.PROVEEDOR;
  }

  private actualizarEmpresa(): void {
    const empresa = this.form.controls.empresaParticipanteId;
    // Solo se valida al crear: al editar la empresa no se puede cambiar
    if (this.poolId === null && this.requiereEmpresa()) {
      empresa.setValidators([Validators.required, Validators.min(1)]);
    } else {
      empresa.clearValidators();
    }
    empresa.updateValueAndValidity();
  }

  private canalONulo(canal: string): string | null {
    const limpio: string = canal.trim();
    return limpio === '' ? null : limpio;
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const datos = this.form.getRawValue();
    this.estado.set('loading');
    this.error.set(null);

    if (this.poolId === null) {
      const nuevo: CrearPoolRequest = {
        nombre: datos.nombre,
        tipoParticipante: datos.tipoParticipante,
        empresaParticipanteId: this.requiereEmpresa() ? datos.empresaParticipanteId : null,
        canalExterno: this.canalONulo(datos.canalExterno),
        cajaNegra: datos.cajaNegra
      };
      this.poolService.crear(this.procesoId, nuevo).subscribe({
        next: () => this.terminar(),
        error: (error: ErrorDto) => this.fallar(error)
      });
    } else {
      this.poolService
        .editar(this.procesoId, this.poolId, {
          nombre: datos.nombre,
          canalExterno: this.canalONulo(datos.canalExterno),
          cajaNegra: datos.cajaNegra
        })
        .subscribe({
          next: () => this.terminar(),
          error: (error: ErrorDto) => this.fallar(error)
        });
    }
  }

  private terminar(): void {
    this.estado.set('success');
    this.router.navigate(['/procesos', this.procesoId, 'pools']);
  }

  private fallar(error: ErrorDto): void {
    this.error.set(error);
    this.estado.set('error');
  }
}
