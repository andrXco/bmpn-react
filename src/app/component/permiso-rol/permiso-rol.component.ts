import { Component, OnInit, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PermisoPoolRequest } from '../../model/pool';
import { RolAcceso } from '../../model/rol-acceso';

// Permisos de un rol de acceso (crear, editar, eliminar) sobre el pool y sus lanes
@Component({
  selector: 'app-permiso-rol',
  imports: [ReactiveFormsModule],
  templateUrl: './permiso-rol.component.html'
})
export class PermisoRolComponent implements OnInit {
  private fb = inject(FormBuilder);

  permiso = input.required<PermisoPoolRequest>();
  guardando = input<boolean>(false);
  guardar = output<PermisoPoolRequest>();

  form = this.fb.nonNullable.group({
    puedeCrear: [false],
    puedeEditar: [false],
    puedeEliminar: [false]
  });

  ngOnInit(): void {
    this.form.patchValue(this.permiso());
    // Solo lectura nunca puede modificar (el backend lo rechaza)
    if (this.esSoloLectura()) {
      this.form.disable();
    }
  }

  esSoloLectura(): boolean {
    return this.permiso().rolAcceso === RolAcceso.SOLO_LECTURA;
  }

  enviar(): void {
    this.guardar.emit({ rolAcceso: this.permiso().rolAcceso, ...this.form.getRawValue() });
  }
}
