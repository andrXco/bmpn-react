import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ErrorDto } from '../../model/error-dto';
import { EstadoPantalla } from '../../model/estado-pantalla';
import {
  CrearProcesoRequest,
  EditarProcesoRequest,
  EstadoProceso,
  ProcesoResponse
} from '../../model/proceso';
import { ProcesoService } from '../../service/proceso.service';
import { campoInvalido } from '../../util/formularios';
import { MensajeErrorComponent } from '../mensaje-error/mensaje-error.component';

@Component({
  selector: 'app-proceso-form',
  imports: [ReactiveFormsModule, RouterLink, MensajeErrorComponent],
  templateUrl: './proceso-form.component.html'
})
export class ProcesoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private procesoService = inject(ProcesoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // null = creando; con valor = editando
  id: number | null = null;

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: ['', [Validators.required]],
    categoria: ['', [Validators.required, Validators.maxLength(100)]],
    estado: this.fb.nonNullable.control<EstadoProceso>(EstadoProceso.BORRADOR)
  });

  estados: EstadoProceso[] = Object.values(EstadoProceso);
  estado = signal<EstadoPantalla>('idle');
  error = signal<ErrorDto | null>(null);

  campoInvalido = campoInvalido;

  ngOnInit(): void {
    const idTexto: string | null = this.route.snapshot.paramMap.get('id');
    if (idTexto === null) {
      return;
    }

    this.id = Number(idTexto);
    this.estado.set('loading');
    this.procesoService.obtener(this.id).subscribe({
      next: (proceso: ProcesoResponse) => {
        this.form.patchValue({
          nombre: proceso.nombre,
          descripcion: proceso.descripcion,
          categoria: proceso.categoria,
          estado: proceso.estado
        });
        this.estado.set('idle');
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

    const datos: EditarProcesoRequest = this.form.getRawValue();
    this.estado.set('loading');
    this.error.set(null);

    if (this.id === null) {
      const nuevo: CrearProcesoRequest = {
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        categoria: datos.categoria
      };
      this.procesoService.crear(nuevo).subscribe({
        next: (proceso: ProcesoResponse) => {
          this.estado.set('success');
          this.router.navigate(['/procesos', proceso.id]);
        },
        error: (error: ErrorDto) => {
          this.error.set(error);
          this.estado.set('error');
        }
      });
    } else {
      this.procesoService.editar(this.id, datos).subscribe({
        next: (proceso: ProcesoResponse) => {
          this.estado.set('success');
          this.router.navigate(['/procesos', proceso.id]);
        },
        error: (error: ErrorDto) => {
          this.error.set(error);
          this.estado.set('error');
        }
      });
    }
  }
}
