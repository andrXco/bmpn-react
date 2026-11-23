import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UsuarioActivoService } from '../service/usuario-activo.service';

// Pantallas para crear o editar: el lector vuelve al listado de procesos
export const puedeEditarGuard: CanActivateFn = () => {
  const usuarioActivo: UsuarioActivoService = inject(UsuarioActivoService);
  const router: Router = inject(Router);
  return usuarioActivo.puedeEditar ? true : router.createUrlTree(['/procesos']);
};

// Pantallas solo del administrador (usuarios, compartir procesos, crear roles)
export const administradorGuard: CanActivateFn = () => {
  const usuarioActivo: UsuarioActivoService = inject(UsuarioActivoService);
  const router: Router = inject(Router);
  return usuarioActivo.esAdministrador ? true : router.createUrlTree(['/procesos']);
};