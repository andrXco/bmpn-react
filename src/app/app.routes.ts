import { Routes } from '@angular/router';
import { EmpresaRegistroComponent } from './component/empresa-registro/empresa-registro.component';
import { NoEncontradoComponent } from './component/no-encontrado/no-encontrado.component';
import { PoolFormComponent } from './component/pool-form/pool-form.component';
import { PoolListaComponent } from './component/pool-lista/pool-lista.component';
import { ProcesoDetalleComponent } from './component/proceso-detalle/proceso-detalle.component';
import { ProcesoFormComponent } from './component/proceso-form/proceso-form.component';
import { ProcesoListaComponent } from './component/proceso-lista/proceso-lista.component';
import { RolProcesoFormComponent } from './component/rol-proceso-form/rol-proceso-form.component';
import { RolProcesoListaComponent } from './component/rol-proceso-lista/rol-proceso-lista.component';

// Las rutas fijas ("nuevo") van antes que las rutas con parámetro (":id")
export const routes: Routes = [
  { path: '', redirectTo: 'procesos', pathMatch: 'full' },

  { path: 'empresas/registro', component: EmpresaRegistroComponent },

  { path: 'procesos', component: ProcesoListaComponent },
  { path: 'procesos/nuevo', component: ProcesoFormComponent },
  { path: 'procesos/:id', component: ProcesoDetalleComponent },
  { path: 'procesos/:id/editar', component: ProcesoFormComponent },

  { path: 'procesos/:procesoId/pools', component: PoolListaComponent },
  { path: 'procesos/:procesoId/pools/nuevo', component: PoolFormComponent },
  { path: 'procesos/:procesoId/pools/:poolId/editar', component: PoolFormComponent },

  { path: 'roles', component: RolProcesoListaComponent },
  { path: 'roles/nuevo', component: RolProcesoFormComponent },
  { path: 'roles/:id/editar', component: RolProcesoFormComponent },

  // Ruta comodín: se muestra la página 404 cuando ninguna ruta coincide
  { path: '**', component: NoEncontradoComponent }
];
