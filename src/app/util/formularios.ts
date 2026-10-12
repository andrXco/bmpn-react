import { AbstractControl } from '@angular/forms';

// Un campo muestra su error solo cuando el usuario ya interactuó con él (touched)
export function campoInvalido(control: AbstractControl): boolean {
  return control.invalid && control.touched;
}
