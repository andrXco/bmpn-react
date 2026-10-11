import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UsuarioActivoService } from '../../service/usuario-activo.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  constructor(public usuarioActivo: UsuarioActivoService) {}

  guardar(valor: string): void {
    const id: number = Number(valor);
    if (Number.isInteger(id) && id > 0) {
      this.usuarioActivo.establecer(id);
    }
  }

  limpiar(): void {
    this.usuarioActivo.limpiar();
  }
}
