import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UsuarioActivoService } from '../../service/usuario-activo.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  readonly usuarioActivo = inject(UsuarioActivoService);
  private readonly router = inject(Router);

  // Cierra la sesión y vuelve al login
  salir(): void {
    this.usuarioActivo.limpiar();
    this.router.navigate(['/login']);
  }
}
