import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ErrorDto } from '../../model/error-dto';
import { EstadoPantalla } from '../../model/estado-pantalla';
import { ProcesoCompartidoResponse } from '../../model/proceso-compartido';
import { ProcesoCompartidoService } from '../../service/proceso-compartido.service';
import { campoInvalido } from '../../util/formularios';
import { MensajeErrorComponent } from '../mensaje-error/mensaje-error.component';

// Empresas con las que se comparte un proceso: lista, compartir con otra empresa y revocar
@Component({
  selector: 'app-proceso-compartido-lista',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, MensajeErrorComponent],
  templateUrl: './proceso-compartido-lista.component.html'
})
export class ProcesoCompartidoListaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private compartidoService = inject(ProcesoCompartidoService);
  private route = inject(ActivatedRoute);

  procesoId: number = 0;
  compartidos = signal<ProcesoCompartidoResponse[]>([]);
  estado = signal<EstadoPantalla>('idle');
  error = signal<ErrorDto | null>(null);
  guardando = signal<boolean>(false);

  form = this.fb.nonNullable.group({
    empresaInvitadaId: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)])
  });

  campoInvalido = campoInvalido;

  ngOnInit(): void {
    this.procesoId = Number(this.route.snapshot.paramMap.get('procesoId'));
    this.cargar();
  }

  cargar(): void {
    this.estado.set('loading');
    this.error.set(null);
    this.compartidoService.listar(this.procesoId).subscribe({
      next: (compartidos: ProcesoCompartidoResponse[]) => {
        this.compartidos.set(compartidos);
        this.estado.set('success');
      },
      error: (error: ErrorDto) => {
        this.error.set(error);
        this.estado.set('error');
      }
    });
  }

  compartir(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const empresaInvitadaId: number = Number(this.form.controls.empresaInvitadaId.value);
    this.guardando.set(true);
    this.error.set(null);
    this.compartidoService.compartir(this.procesoId, { empresaInvitadaId }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.form.reset();
        this.cargar();
      },
      error: (error: ErrorDto) => {
        this.guardando.set(false);
        this.error.set(error);
      }
    });
  }

  revocar(compartido: ProcesoCompartidoResponse): void {
    if (!confirm(`¿Dejar de compartir el proceso con "${compartido.nombreEmpresaInvitada}"?`)) {
      return;
    }
    this.compartidoService.revocar(this.procesoId, compartido.id).subscribe({
      next: () => this.cargar(),
      error: (error: ErrorDto) => this.error.set(error)
    });
  }
}
