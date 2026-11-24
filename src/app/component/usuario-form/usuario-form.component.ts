import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ErrorDto } from '../../model/error-dto';
import { EstadoPantalla } from '../../model/estado-pantalla';
import { RolAcceso } from '../../model/rol-acceso';
import { RegistrarUsuarioRequest } from '../../model/usuario';
import { UsuarioService } from '../../service/usuario.service';
import { campoInvalido } from '../../util/formularios';
import { MensajeErrorComponent } from '../mensaje-error/mensaje-error.component';

@Component({
  selector: 'app-usuario-form',
  imports: [ReactiveFormsModule, RouterLink, MensajeErrorComponent],
  templateUrl: './usuario-form.component.html'
})
export class UsuarioFormComponent {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  // Los nombres de los controles son los mismos del DTO RegistrarUsuarioRequest
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellido: ['', [Validators.required, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    rolAcceso: this.fb.nonNullable.control<RolAcceso>(RolAcceso.EDITOR, Validators.required)
  });

  roles: RolAcceso[] = [RolAcceso.ADMINISTRADOR, RolAcceso.EDITOR, RolAcceso.SOLO_LECTURA];
  estado = signal<EstadoPantalla>('idle');
  error = signal<ErrorDto | null>(null);

  campoInvalido = campoInvalido;

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const solicitud: RegistrarUsuarioRequest = this.form.getRawValue();
    this.estado.set('loading');
    this.error.set(null);

    this.usuarioService.registrar(solicitud).subscribe({
      next: () => {
        this.estado.set('success');
        this.router.navigate(['/usuarios']);
      },
      error: (error: ErrorDto) => {
        this.error.set(error);
        this.estado.set('error');
      }
    });
  }
}
