import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorDto } from '../../model/error-dto';
import { EstadoPantalla } from '../../model/estado-pantalla';
import { RolAcceso } from '../../model/rol-acceso';
import { UsuarioResponse } from '../../model/usuario';
import { UsuarioActivoService } from '../../service/usuario-activo.service';
import { UsuarioService } from '../../service/usuario.service';
import { MensajeErrorComponent } from '../mensaje-error/mensaje-error.component';

@Component({
  selector: 'app-usuario-lista',
  imports: [RouterLink, DatePipe, MensajeErrorComponent],
  templateUrl: './usuario-lista.component.html'
})
export class UsuarioListaComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  readonly usuarioActivo = inject(UsuarioActivoService);
  usuarios = signal<UsuarioResponse[]>([]);
  error = signal<ErrorDto | null>(null);
  estado = signal<EstadoPantalla>('idle');
  roles: RolAcceso[] = [RolAcceso.ADMINISTRADOR, RolAcceso.EDITOR, RolAcceso.SOLO_LECTURA];

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.estado.set('loading');
    this.error.set(null);
    this.usuarioService.listar().subscribe({
      next: (usuarios: UsuarioResponse[]) => {
        this.usuarios.set(usuarios);
        this.estado.set('success');
      },
      error: (error: ErrorDto) => {
        this.error.set(error);
        this.estado.set('error');
      }
    });
  }

  cambiarRol(usuario: UsuarioResponse, valor: string): void {
    const rol: RolAcceso = valor as RolAcceso;
    if (rol === usuario.rolAcceso) {
      return;
    }
    this.error.set(null);
    this.usuarioService.cambiarRol(usuario.id, { rolAcceso: rol }).subscribe({
      next: () => this.cargar(),
      error: (error: ErrorDto) => {
        this.error.set(error);
        this.cargar(); // vuelve a mostrar el rol real
      }
    });
  }

  cambiarRolDesdeEvento(usuario: UsuarioResponse, evento: Event): void {
    const control = evento.target;
    if (control instanceof HTMLSelectElement) {
      this.cambiarRol(usuario, control.value);
    }
  }

  desactivar(usuario: UsuarioResponse): void {
    if (!confirm(`¿Desactivar al usuario ${usuario.nombre} ${usuario.apellido}?`)) {
      return;
    }
    this.usuarioService.desactivar(usuario.id).subscribe({
      next: () => this.cargar(),
      error: (error: ErrorDto) => this.error.set(error)
    });
  }
}
