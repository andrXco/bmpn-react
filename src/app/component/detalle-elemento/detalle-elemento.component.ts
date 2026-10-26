import { Component, input, output } from '@angular/core';
import { NodoDiagrama } from '../../model/diagrama';

// Muestra los datos del elemento que se selecciono en el diagrama
@Component({
  selector: 'app-detalle-elemento',
  templateUrl: './detalle-elemento.component.html'
})
export class DetalleElementoComponent {
  nodo = input.required<NodoDiagrama>();
  nombreLane = input<string>('Sin lane');
  conexiones = input<string[]>([]);
  cerrar = output<void>();
}
