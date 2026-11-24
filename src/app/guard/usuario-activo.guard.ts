import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UsuarioActivoService } from '../service/usuario-activo.service';

// Protege las pantallas que necesitan ?usuarioId=: sin usuario activo se redirige al login
export const usuarioActivoGuard: CanActivateFn = () => {
  const usuarioActivo: UsuarioActivoService = inject(UsuarioActivoService);
  const router: Router = inject(Router);
  return usuarioActivo.usuarioId !== null ? true : router.createUrlTree(['/login']);
};
