// Datos ya ubicados en pantalla para dibujar el diagrama (no vienen asi del backend)

export type TipoNodo = 'ACTIVIDAD' | 'GATEWAY' | 'EVENTO';

export interface NodoDiagrama {
  id: number;
  tipo: TipoNodo;
  nombre: string;
  subtipo: string;
  poolId: number;
  laneId: number | null;
  posicionX: number;
  advertencias: string[];
  x: number;
  y: number;
}

export interface FilaDiagrama {
  laneId: number | null;
  titulo: string;
  y: number;
}

export interface PoolDiagrama {
  id: number;
  nombre: string;
  y: number;
  alto: number;
  filas: FilaDiagrama[];
}

// La linea se dibuja con varios tramos rectos: "x1,y1 x2,y2 x3,y3"
export interface LineaDiagrama {
  tipo: 'arco' | 'mensaje';
  puntos: string;
  textoX: number;
  textoY: number;
  texto: string | null;
}
