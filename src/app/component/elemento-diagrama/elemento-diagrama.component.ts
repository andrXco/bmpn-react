import { Component, input, output } from '@angular/core';
import { NodoDiagrama } from '../../model/diagrama';

// Un elemento del diagrama: actividad, gateway o evento
@Component({
  selector: 'app-elemento-diagrama',
  templateUrl: './elemento-diagrama.component.html',
  styleUrl: './elemento-diagrama.component.css'
})
export class ElementoDiagramaComponent {
  nodo = input.required<NodoDiagrama>();
  seleccionado = input<boolean>(false);
  seleccionar = output<NodoDiagrama>();
}
