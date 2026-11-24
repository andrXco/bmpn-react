import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CampoMensaje, DatosMensaje, PoliticaFallo, PoliticaSinCorrespondencia } from '../../model/mensaje';
import { campoInvalido } from '../../util/formularios';

// Datos de un mensaje entre pools (HU-25 a HU-28). Se abre desde el diagrama al dibujar el flujo de mensaje:
// recibe los nombres del origen y del destino y devuelve lo que se llenó, sin llamar al backend.
@Component({
  selector: 'app-mensaje-form',
  imports: [ReactiveFormsModule],
  templateUrl: './mensaje-form.component.html'
})
export class MensajeFormComponent {
  private fb = inject(FormBuilder);

  origen = input.required<string>();
  destino = input.required<string>();
  // El destino es un sistema externo (HU-26): se pregunta qué pasa si la notificación falla
  notificacionExterna = input<boolean>(false);

  guardar = output<DatosMensaje>();
  cancelar = output<void>();

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    claveCorrelacion: ['', [Validators.required, Validators.maxLength(150)]],
    politicaSinCorrespondencia: this.fb.control<PoliticaSinCorrespondencia | null>(null),
    politicaFallo: this.fb.control<PoliticaFallo | null>(null)
  });

  // Formulario pequeño para ir agregando los campos del mensaje uno por uno
  campoForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    tipoDato: ['TEXTO', [Validators.required]],
    obligatorio: [false]
  });

  campos = signal<CampoMensaje[]>([]);
  errorCampo = signal<string>('');

  tiposDato: string[] = ['TEXTO', 'NUMERO', 'FECHA', 'BOOLEANO'];
  opcionesSinCorrespondencia = [
    { valor: PoliticaSinCorrespondencia.DESCARTAR, texto: 'Descartar el mensaje' },
    { valor: PoliticaSinCorrespondencia.INICIAR_CASO_NUEVO, texto: 'Iniciar un caso nuevo' }
  ];
  opcionesFallo = [
    { valor: PoliticaFallo.CONTINUAR, texto: 'Continuar el proceso' },
    { valor: PoliticaFallo.IR_A_ACTIVIDAD_DE_ERROR, texto: 'Ir a una actividad de error' },
    { valor: PoliticaFallo.FINALIZAR_PROCESO, texto: 'Finalizar el proceso' }
  ];

  campoInvalido = campoInvalido;

  agregarCampo(): void {
    if (this.campoForm.invalid) {
      this.campoForm.markAllAsTouched();
      return;
    }
    const datos = this.campoForm.getRawValue();
    const nombre: string = datos.nombre.trim();
    // El backend tampoco deja repetir un campo dentro del mismo mensaje
    if (this.campos().some((campo: CampoMensaje) => campo.nombre.toLowerCase() === nombre.toLowerCase())) {
      this.errorCampo.set(`El campo "${nombre}" ya está en el mensaje.`);
      return;
    }
    this.campos.update((lista: CampoMensaje[]) => [
      ...lista,
      { nombre: nombre, tipoDato: datos.tipoDato, descripcion: null, obligatorio: datos.obligatorio }
    ]);
    this.errorCampo.set('');
    this.campoForm.reset({ nombre: '', tipoDato: 'TEXTO', obligatorio: false });
  }

  quitarCampo(indice: number): void {
    this.campos.update((lista: CampoMensaje[]) => lista.filter((_, i: number) => i !== indice));
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = this.form.getRawValue();
    this.guardar.emit({
      nombre: datos.nombre.trim(),
      claveCorrelacion: datos.claveCorrelacion.trim(),
      politicaSinCorrespondencia: datos.politicaSinCorrespondencia,
      politicaFallo: this.notificacionExterna() ? datos.politicaFallo : null,
      campos: this.campos()
    });
  }
}