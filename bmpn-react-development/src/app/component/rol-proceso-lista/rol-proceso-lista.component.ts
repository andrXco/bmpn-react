import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ErrorDto } from '../../model/error-dto';
import { EstadoPantalla } from '../../model/estado-pantalla';
import { Pagina } from '../../model/pagina';
import { FiltroRolProceso, RolProcesoResponse } from '../../model/rol-proceso';
import { RolProcesoService } from '../../service/rol-proceso.service';
import { MensajeErrorComponent } from '../mensaje-error/mensaje-error.component';

@Component({
  selector: 'app-rol-proceso-lista',
  imports: [ReactiveFormsModule, RouterLink, MensajeErrorComponent],
  templateUrl: './rol-proceso-lista.component.html'
})
export class RolProcesoListaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private rolProcesoService = inject(RolProcesoService);

  // Formulario de filtros
  filtroForm = this.fb.nonNullable.group({
    nombre: [''],
    incluirInactivos: [false]
  });

  // Filtro que se aplicó en la última búsqueda (la paginación lo reutiliza)
  filtroActual: FiltroRolProceso = this.construirFiltro(0);

  estado = signal<EstadoPantalla>('idle');
  pagina = signal<Pagina<RolProcesoResponse> | null>(null);
  error = signal<ErrorDto | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  private construirFiltro(page: number): FiltroRolProceso {
    return { ...this.filtroForm.getRawValue(), page: page, size: 10 };
  }

  cargar(): void {
    this.estado.set('loading');
    this.error.set(null);
    this.rolProcesoService.listar(this.filtroActual).subscribe({
      next: (pagina: Pagina<RolProcesoResponse>) => {
        this.pagina.set(pagina);
        this.estado.set('success');
      },
      error: (error: ErrorDto) => {
        this.pagina.set(null);
        this.error.set(error);
        this.estado.set('error');
      }
    });
  }

  buscar(): void {
    this.filtroActual = this.construirFiltro(0);
    this.cargar();
  }

  irAPagina(numero: number): void {
    this.filtroActual = { ...this.filtroActual, page: numero };
    this.cargar();
  }

  eliminar(rol: RolProcesoResponse): void {
    if (!confirm(`¿Eliminar el rol "${rol.nombre}"?`)) {
      return;
    }
    this.rolProcesoService.eliminar(rol.id).subscribe({
      next: () => this.cargar(),
      error: (error: ErrorDto) => this.error.set(error)
    });
  }
}
