import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EmpresaResponse, RegistrarEmpresaRequest } from '../../model/empresa';
import { ErrorDto } from '../../model/error-dto';
import { EstadoPantalla } from '../../model/estado-pantalla';
import { EmpresaService } from '../../service/empresa.service';
import { UsuarioActivoService } from '../../service/usuario-activo.service';
import { campoInvalido } from '../../util/formularios';
import { MensajeErrorComponent } from '../mensaje-error/mensaje-error.component';

@Component({
  selector: 'app-empresa-registro',
  imports: [ReactiveFormsModule, RouterLink, MensajeErrorComponent],
  templateUrl: './empresa-registro.component.html'
})
export class EmpresaRegistroComponent {
  private fb = inject(FormBuilder);
  private empresaService = inject(EmpresaService);
  private usuarioActivo = inject(UsuarioActivoService);

  form = this.fb.nonNullable.group({
    nit: ['', [Validators.required, Validators.maxLength(30)]],
    nombreEmpresa: ['', [Validators.required, Validators.maxLength(150)]],
    correoContacto: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    nombreAdministrador: ['', [Validators.required, Validators.maxLength(100)]],
    apellidoAdministrador: ['', [Validators.required, Validators.maxLength(100)]],
    emailAdministrador: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]]
  });

  estado = signal<EstadoPantalla>('idle');
  empresaCreada = signal<EmpresaResponse | null>(null);
  error = signal<ErrorDto | null>(null);

  campoInvalido = campoInvalido;

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const solicitud: RegistrarEmpresaRequest = this.form.getRawValue();
    this.estado.set('loading');
    this.error.set(null);
    this.empresaCreada.set(null);

    this.empresaService.registrar(solicitud).subscribe({
      next: (empresa: EmpresaResponse) => {
        this.empresaCreada.set(empresa);
        // El administrador recién creado queda como usuario activo
        this.usuarioActivo.establecer(empresa.administradorInicial.id);
        this.form.reset();
        this.estado.set('success');
      },
      error: (error: ErrorDto) => {
        this.error.set(error);
        this.estado.set('error');
      }
    });
  }
}
