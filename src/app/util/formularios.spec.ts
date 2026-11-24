import { FormControl, Validators } from '@angular/forms';
import { campoInvalido } from './formularios';

describe('formularios', () => {
  it('no marca el campo vacío mientras el usuario no lo ha tocado', () => {
    const control = new FormControl('', Validators.required);

    expect(campoInvalido(control)).toBe(false);
  });

  it('marca el campo cuando es inválido y ya fue tocado', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();

    expect(campoInvalido(control)).toBe(true);
  });

  it('no marca un campo válido aunque ya fue tocado', () => {
    const control = new FormControl('Compras', Validators.required);
    control.markAsTouched();

    expect(campoInvalido(control)).toBe(false);
  });
});