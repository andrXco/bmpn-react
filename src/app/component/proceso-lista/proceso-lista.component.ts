import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ErrorDto } from '../../model/error-dto';
import { EstadoPantalla } from '../../model/estado-pantalla';
import { Pagina } from '../../model/pagina';
import { EstadoProceso, FiltroProceso, ProcesoResumen } from '../../model/proceso';
import { ProcesoService } from '../../service/proceso.service';
import { MensajeErrorComponent } from '../mensaje-error/mensaje-error.component';

@Component({
  selector: 'app-proceso-lista',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, MensajeErrorComponent],
  templateUrl: './proceso-lista.component.html'
})
export class ProcesoListaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private procesoService = inject(ProcesoService);

  // Formulario de filtros
  filtroForm = this.fb.nonNullable.group({
    nombre: [''],
    categoria: [''],
    estado: this.fb.nonNullable.control<EstadoProceso | ''>(''),
    incluirInactivos: [false]
  });

  // Filtro que se aplicó en la última búsqueda (la paginación lo reutiliza)
  filtroActual: FiltroProceso = this.construirFiltro(0);

  estados: EstadoProceso[] = Object.values(EstadoProceso);
  estadoProceso: typeof EstadoProceso = EstadoProceso;

  estado = signal<EstadoPantalla>('idle');
  pagina = signal<Pagina<ProcesoResumen> | null>(null);
  error = signal<ErrorDto | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  private construirFiltro(page: number): FiltroProceso {
    return { ...this.filtroForm.getRawValue(), page: page, size: 10 };
  }

  cargar(): void {
    this.estado.set('loading');
    this.error.set(null);
    this.procesoService.listar(this.filtroActual).subscribe({
      next: (pagina: Pagina<ProcesoResumen>) => {
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

  limpiarFiltros(): void {
    this.filtroForm.reset();
    this.buscar();
  }

  irAPagina(numero: number): void {
    this.filtroActual = { ...this.filtroActual, page: numero };
    this.cargar();
  }

  eliminar(proceso: ProcesoResumen): void {
    if (!confirm(`¿Eliminar el proceso "${proceso.nombre}"?`)) {
      return;
    }
    this.procesoService.eliminar(proceso.id).subscribe({
      next: () => this.cargar(),
      error: (error: ErrorDto) => this.error.set(error)
    });
  }
}
