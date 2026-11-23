import { Routes } from '@angular/router';
import { EmpresaRegistroComponent } from './component/empresa-registro/empresa-registro.component';
import { LaneFormComponent } from './component/lane-form/lane-form.component';
import { LaneListaComponent } from './component/lane-lista/lane-lista.component';
import { LoginComponent } from './component/login/login.component';
import { NoEncontradoComponent } from './component/no-encontrado/no-encontrado.component';
import { PoolFormComponent } from './component/pool-form/pool-form.component';
import { PoolListaComponent } from './component/pool-lista/pool-lista.component';
import { PoolPermisosComponent } from './component/pool-permisos/pool-permisos.component';
import { ProcesoCompartidoListaComponent } from './component/proceso-compartido-lista/proceso-compartido-lista.component';
import { ProcesoDetalleComponent } from './component/proceso-detalle/proceso-detalle.component';
import { ProcesoFormComponent } from './component/proceso-form/proceso-form.component';
import { ProcesoListaComponent } from './component/proceso-lista/proceso-lista.component';
import { RolProcesoFormComponent } from './component/rol-proceso-form/rol-proceso-form.component';
import { RolProcesoListaComponent } from './component/rol-proceso-lista/rol-proceso-lista.component';
import { UsuarioFormComponent } from './component/usuario-form/usuario-form.component';
import { UsuarioListaComponent } from './component/usuario-lista/usuario-lista.component';
import { administradorGuard, puedeEditarGuard } from './guard/rol.guard';
import { usuarioActivoGuard } from './guard/usuario-activo.guard';

// Las rutas fijas ("nuevo") van antes que las rutas con parámetro (":id")
export const routes: Routes = [
  { path: '', redirectTo: 'procesos', pathMatch: 'full' },

  // Rutas públicas
  { path: 'login', component: LoginComponent },
  { path: 'empresas/registro', component: EmpresaRegistroComponent },

  // Rutas que necesitan un usuario activo (?usuarioId=): sin sesión se redirige a /login.
  // Las de crear y editar piden además el rol (puedeEditarGuard o administradorGuard)
  {
    path: '',
    canActivate: [usuarioActivoGuard],
    children: [
      { path: 'procesos', component: ProcesoListaComponent },
      { path: 'procesos/nuevo', component: ProcesoFormComponent, canActivate: [puedeEditarGuard] },
      { path: 'procesos/:id', component: ProcesoDetalleComponent },
      { path: 'procesos/:id/editar', component: ProcesoFormComponent, canActivate: [puedeEditarGuard] },
      // El diagrama usa bpmn-js, que es pesado: se descarga solo cuando se abre esta pantalla
      {
        path: 'procesos/:id/diagrama',
        loadComponent: () => import('./component/diagrama/diagrama.component').then(m => m.DiagramaComponent)
      },

      { path: 'procesos/:procesoId/compartidos', component: ProcesoCompartidoListaComponent, canActivate: [administradorGuard] },

      { path: 'procesos/:procesoId/pools', component: PoolListaComponent },
      { path: 'procesos/:procesoId/pools/nuevo', component: PoolFormComponent, canActivate: [puedeEditarGuard] },
      { path: 'procesos/:procesoId/pools/:poolId/editar', component: PoolFormComponent, canActivate: [puedeEditarGuard] },
      { path: 'procesos/:procesoId/pools/:poolId/permisos', component: PoolPermisosComponent },

      { path: 'procesos/:procesoId/pools/:poolId/lanes', component: LaneListaComponent },
      { path: 'procesos/:procesoId/pools/:poolId/lanes/nuevo', component: LaneFormComponent, canActivate: [puedeEditarGuard] },
      { path: 'procesos/:procesoId/pools/:poolId/lanes/:laneId/editar', component: LaneFormComponent, canActivate: [puedeEditarGuard] },

      { path: 'roles', component: RolProcesoListaComponent },
      { path: 'roles/nuevo', component: RolProcesoFormComponent, canActivate: [administradorGuard] },
      { path: 'roles/:id/editar', component: RolProcesoFormComponent, canActivate: [puedeEditarGuard] },

      { path: 'usuarios', component: UsuarioListaComponent, canActivate: [administradorGuard] },
      { path: 'usuarios/nuevo', component: UsuarioFormComponent, canActivate: [administradorGuard] }
    ]
  },

  // Se muestra la página 404 cuando ninguna ruta coincide
  { path: '**', component: NoEncontradoComponent }
];
