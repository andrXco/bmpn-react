import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ErrorDto } from '../../model/error-dto';
import { EstadoPantalla } from '../../model/estado-pantalla';
import { IniciarSesionRequest, SesionUsuarioResponse } from '../../model/sesion';
import { AutenticacionService } from '../../service/autenticacion.service';
import { UsuarioActivoService } from '../../service/usuario-activo.service';
import { campoInvalido } from '../../util/formularios';
import { MensajeErrorComponent } from '../mensaje-error/mensaje-error.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, MensajeErrorComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private autenticacionService = inject(AutenticacionService);
  private usuarioActivo = inject(UsuarioActivoService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.maxLength(100)]]
  });

  estado = signal<EstadoPantalla>('idle');
  error = signal<ErrorDto | null>(null);

  campoInvalido = campoInvalido;

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const solicitud: IniciarSesionRequest = this.form.getRawValue();
    this.estado.set('loading');
    this.error.set(null);

    this.autenticacionService.iniciarSesion(solicitud).subscribe({
      next: (sesion: SesionUsuarioResponse) => {
        // Desde aquí todas las peticiones llevan ?usuarioId=<id de la sesión>
        this.usuarioActivo.iniciarSesion(sesion);
        this.estado.set('success');
        this.router.navigate(['/procesos']);
      },
      error: (error: ErrorDto) => {
        this.error.set(error);
        this.estado.set('error');
      }
    });
  }
}
