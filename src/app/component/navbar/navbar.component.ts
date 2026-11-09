import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { AutenticacionService } from '../../service/autenticacion.service';
import { UsuarioActivoService } from '../../service/usuario-activo.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  constructor(
    public usuarioActivo: UsuarioActivoService,
    private router: Router,
    private autenticacionService: AutenticacionService
  ) {}

  // Cierra la sesión y vuelve al login
  salir(): void {
    this.autenticacionService.cerrarSesion().pipe(
      catchError(() => of(void 0)),
      finalize(() => {
        this.usuarioActivo.limpiar();
        this.router.navigate(['/login']);
      })
    ).subscribe();
  }
}
