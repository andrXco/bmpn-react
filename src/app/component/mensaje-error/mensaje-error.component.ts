import { Component, Input } from '@angular/core';
import { ErrorDto } from '../../model/error-dto';

@Component({
  selector: 'app-mensaje-error',
  templateUrl: './mensaje-error.component.html'
})
export class MensajeErrorComponent {
  @Input() error: ErrorDto | null = null;
}
