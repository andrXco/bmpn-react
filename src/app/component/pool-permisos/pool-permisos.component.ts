import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ErrorDto } from '../../model/error-dto';
import { EstadoPantalla } from '../../model/estado-pantalla';
import { PermisoPoolRequest, PermisoPoolResponse, PoolResponse, RolPoolResponse } from '../../model/pool';
import { RolAcceso } from '../../model/rol-acceso';
import { RolProcesoResponse } from '../../model/rol-proceso';
import { PoolService } from '../../service/pool.service';
import { RolProcesoService } from '../../service/rol-proceso.service';
import { campoInvalido } from '../../util/formularios';
import { MensajeErrorComponent } from '../mensaje-error/mensaje-error.component';
import { PermisoRolComponent } from '../permiso-rol/permiso-rol.component';

// HU-24: roles de proceso disponibles en el pool y permisos de cada rol de acceso
@Component({
  selector: 'app-pool-permisos',
  imports: [ReactiveFormsModule, RouterLink, MensajeErrorComponent, PermisoRolComponent],
  templateUrl: './pool-permisos.component.html'
})
export class PoolPermisosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private poolService = inject(PoolService);
  private rolProcesoService = inject(RolProcesoService);

  procesoId: number = 0;
  poolId: number = 0;

  estado = signal<EstadoPantalla>('idle');
  error = signal<ErrorDto | null>(null);
  mensaje = signal<string>('');
  guardando = signal<boolean>(false);

  pool = signal<PoolResponse | null>(null);
  rolesDisponibles = signal<RolPoolResponse[]>([]);
  rolesEmpresa = signal<RolProcesoResponse[]>([]);
  permisos = signal<PermisoPoolRequest[]>([]);

  // En el selector solo aparecen los roles que el pool todavia no tiene
  rolesParaAgregar = computed<RolProcesoResponse[]>(() => {
    const ids: number[] = this.rolesDisponibles().map(r => r.rolProcesoId);
    return this.rolesEmpresa().filter(rol => !ids.includes(rol.id));
  });

  form = this.fb.group({
    rolProcesoId: this.fb.control<number | null>(null, Validators.required)
  });

  campoInvalido = campoInvalido;

  ngOnInit(): void {
    this.procesoId = Number(this.route.snapshot.paramMap.get('procesoId'));
    this.poolId = Number(this.route.snapshot.paramMap.get('poolId'));
    this.cargar();
  }

  cargar(): void {
    this.estado.set('loading');
    this.error.set(null);
    forkJoin({
      pool: this.poolService.obtener(this.procesoId, this.poolId),
      roles: this.poolService.listarRolesDisponibles(this.procesoId, this.poolId),
      permisos: this.poolService.listarPermisos(this.procesoId, this.poolId),
      rolesEmpresa: this.rolProcesoService.listar({ nombre: '', incluirInactivos: false, page: 0, size: 100 })
    }).subscribe({
      next: datos => {
        this.pool.set(datos.pool);
        this.rolesDisponibles.set(datos.roles.filter(r => r.activo));
        this.rolesEmpresa.set(datos.rolesEmpresa.content);
        this.permisos.set(this.armarPermisos(datos.permisos));
        this.estado.set('success');
      },
      error: (error: ErrorDto) => {
        this.error.set(error);
        this.estado.set('error');
      }
    });
  }

  // Una fila por cada rol de acceso; si el rol no tiene permiso guardado, todo en falso
  private armarPermisos(guardados: PermisoPoolResponse[]): PermisoPoolRequest[] {
    return Object.values(RolAcceso).map(rol => {
      const permiso: PermisoPoolResponse | undefined = guardados.find(p => p.rolAcceso === rol);
      return {
        rolAcceso: rol,
        puedeCrear: permiso?.puedeCrear ?? false,
        puedeEditar: permiso?.puedeEditar ?? false,
        puedeEliminar: permiso?.puedeEliminar ?? false
      };
    });
  }

  agregarRol(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const rolProcesoId: number = this.form.getRawValue().rolProcesoId as number;
    this.error.set(null);
    this.mensaje.set('');
    this.poolService.asociarRol(this.procesoId, this.poolId, { rolProcesoId }).subscribe({
      next: (rol: RolPoolResponse) => {
        this.rolesDisponibles.update(lista => [...lista, rol]);
        this.form.reset();
      },
      error: (error: ErrorDto) => this.error.set(error)
    });
  }

  quitarRol(rol: RolPoolResponse): void {
    if (!confirm(`¿Quitar el rol "${rol.nombreRol}" de este pool?`)) {
      return;
    }
    this.error.set(null);
    this.mensaje.set('');
    this.poolService.desvincularRol(this.procesoId, this.poolId, rol.rolProcesoId).subscribe({
      next: () => this.rolesDisponibles.update(lista => lista.filter(r => r.rolProcesoId !== rol.rolProcesoId)),
      error: (error: ErrorDto) => this.error.set(error)
    });
  }

  guardarPermiso(permiso: PermisoPoolRequest): void {
    this.guardando.set(true);
    this.error.set(null);
    this.mensaje.set('');
    this.poolService.definirPermiso(this.procesoId, this.poolId, permiso).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mensaje.set(`Permisos de ${permiso.rolAcceso} guardados.`);
      },
      error: (error: ErrorDto) => {
        this.guardando.set(false);
        this.error.set(error);
      }
    });
  }
}
