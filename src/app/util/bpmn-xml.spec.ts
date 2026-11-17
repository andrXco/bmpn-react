import { idActividad, idEvento, idMensaje, numeroDeId } from './bpmn-xml';

describe('bpmn-xml', () => {
  it('arma el id del diagrama con el tipo y el id del backend', () => {
    expect(idActividad(5)).toBe('Actividad_5');
    expect(idEvento(12)).toBe('Evento_12');
    expect(idMensaje(3)).toBe('Mensaje_3');
  });

  it('numeroDeId recupera el id del backend', () => {
    expect(numeroDeId('Actividad_5', 'Actividad')).toBe(5);
    expect(numeroDeId(idEvento(12), 'Evento')).toBe(12);
  });

  it('numeroDeId devuelve null si el prefijo no coincide', () => {
    expect(numeroDeId('Evento_7', 'Actividad')).toBeNull();
  });

  it('numeroDeId devuelve null para un elemento que todavía no está guardado', () => {
    // bpmn-js le pone ids propios a lo que se acaba de dibujar, por ejemplo Activity_0abc123
    expect(numeroDeId('Activity_0abc123', 'Actividad')).toBeNull();
  });
});