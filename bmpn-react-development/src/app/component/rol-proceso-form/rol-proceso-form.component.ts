import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ErrorDto } from '../../model/error-dto';
import { EstadoPantalla } from '../../model/estado-pantalla';
import { CrearRolProcesoRequest, RolProcesoResponse } from '../../model/rol-proceso';
import { RolProcesoService } from '../../service/rol-proceso.service';
import { campoInvalido } from '../../util/formularios';
import { MensajeErrorComponent } from '../mensaje-error/mensaje-error.component';

@Component({
  selector: 'app-rol-proceso-form',
  imports: [ReactiveFormsModule, RouterLink, MensajeErrorComponent],
  templateUrl: './rol-proceso-form.component.html'
})
export class RolProcesoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private rolProcesoService = inject(RolProcesoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // null = creando; con valor = editando
  id: number | null = null;

  // Crear y editar usan los mismos campos (nombre y descripción)
  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', [Validators.maxLength(500)]]
  });

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
    this.rolProcesoService.obtener(this.id).subscribe({
      next: (rol: RolProcesoResponse) => {
        this.form.patchValue({ nombre: rol.nombre, descripcion: rol.descripcion ?? '' });
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

    const datos: CrearRolProcesoRequest = this.form.getRawValue();
    this.estado.set('loading');
    this.error.set(null);

    const peticion = this.id === null
      ? this.rolProcesoService.crear(datos)
      : this.rolProcesoService.editar(this.id, datos);

    peticion.subscribe({
      next: () => {
        this.estado.set('success');
        this.router.navigate(['/roles']);
      },
      error: (error: ErrorDto) => {
        this.error.set(error);
        this.estado.set('error');
      }
    });
  }
}
