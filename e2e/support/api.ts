import { APIRequestContext, expect, request } from '@playwright/test';

// Preparación de datos por la API: las pruebas E2E solo usan la interfaz para lo que verifican,
// y todo lo demás (empresas, usuarios, procesos, lanes) se crea aquí, que es rápido y estable.
// Cada prueba usa correos y NIT únicos, por eso no necesita limpiar ni depende de otras pruebas.

export const API_URL: string = process.env['E2E_API_URL'] ?? 'http://localhost:8080/api';
export const CLAVE: string = 'ClaveSegura123';

export type Rol = 'ADMINISTRADOR' | 'EDITOR' | 'SOLO_LECTURA';

export interface Sesion {
  email: string;
  usuarioId: number;
  empresaId: number;
  rolAcceso: Rol;
  token: string;
}

export interface Empresa {
  nombre: string;
  admin: Sesion;
}

let contador: number = 0;

// Sufijo único aunque las pruebas corran en paralelo en varios procesos
export function unico(): string {
  contador++;
  return `${Date.now().toString(36)}${process.pid.toString(36)}${contador}`;
}

export class ApiBmpn {
  private constructor(private readonly http: APIRequestContext) {}

  static async crear(): Promise<ApiBmpn> {
    return new ApiBmpn(await request.newContext());
  }

  async cerrar(): Promise<void> {
    await this.http.dispose();
  }

  // ---- Empresas, sesiones y usuarios ----

  async registrarEmpresa(prefijo: string = 'Empresa'): Promise<Empresa> {
    const id: string = unico();
    const nombre: string = `${prefijo} E2E ${id}`;
    const email: string = `admin.${id}@e2e.test`;
    const respuesta = await this.http.post(`${API_URL}/empresas`, {
      data: {
        nit: `E2E-${id}`.slice(0, 30),
        nombreEmpresa: nombre,
        correoContacto: `contacto.${id}@e2e.test`,
        nombreAdministrador: 'Ana',
        apellidoAdministrador: 'Prueba',
        emailAdministrador: email,
        password: CLAVE
      }
    });
    await this.esperar(respuesta, 201);
    return { nombre, admin: await this.iniciarSesion(email) };
  }

  async iniciarSesion(email: string, password: string = CLAVE): Promise<Sesion> {
    const respuesta = await this.http.post(`${API_URL}/sesiones`, { data: { email, password } });
    await this.esperar(respuesta, 200);
    const cuerpo = await respuesta.json();
    return {
      email,
      usuarioId: cuerpo.usuarioId,
      empresaId: cuerpo.empresaId,
      rolAcceso: cuerpo.rolAcceso,
      token: cuerpo.accessToken
    };
  }

  async registrarUsuario(admin: Sesion, rol: Rol): Promise<Sesion> {
    const email: string = `${rol.toLowerCase()}.${unico()}@e2e.test`;
    await this.post(admin, '/usuarios', {
      email, nombre: 'Carlos', apellido: rol === 'EDITOR' ? 'Editor' : 'Lector', password: CLAVE, rolAcceso: rol
    });
    return this.iniciarSesion(email);
  }

  // ---- Procesos y diagrama ----

  async crearProceso(sesion: Sesion, nombre: string): Promise<{ id: number; poolId: number }> {
    const proceso = await this.post(sesion, '/procesos', {
      nombre, descripcion: 'Proceso creado por las pruebas E2E', categoria: 'E2E'
    });
    return { id: proceso.id, poolId: proceso.poolPropietarioId };
  }

  async crearLane(admin: Sesion, procesoId: number, poolId: number, nombreRol: string): Promise<number> {
    const rol = await this.post(admin, '/roles-proceso', { nombre: `${nombreRol} ${unico()}`, descripcion: 'E2E' });
    const lane = await this.post(admin, `/procesos/${procesoId}/pools/${poolId}/lanes`, { rolProcesoId: rol.id });
    return lane.id;
  }

  async crearActividad(sesion: Sesion, procesoId: number, laneId: number, nombre: string,
                       posicionX: number): Promise<number> {
    const actividad = await this.post(sesion, `/procesos/${procesoId}/actividades`, {
      nombre, tipoActividad: 'USUARIO', posicionX, posicionY: 60, laneId
    });
    return actividad.id;
  }

  async compartir(dueno: Sesion, procesoId: number, invitada: Sesion): Promise<void> {
    await this.post(dueno, `/procesos/${procesoId}/compartidos`, { empresaInvitadaId: invitada.empresaId });
  }

  async actividades(sesion: Sesion, procesoId: number): Promise<{ id: number; nombre: string }[]> {
    return this.get(sesion, `/procesos/${procesoId}/actividades`);
  }

  async arcos(sesion: Sesion, procesoId: number): Promise<{ origenId: number; destinoId: number }[]> {
    return this.get(sesion, `/procesos/${procesoId}/arcos`);
  }

  async procesos(sesion: Sesion): Promise<{ id: number; nombre: string }[]> {
    const pagina = await this.get(sesion, '/procesos');
    return pagina.content;
  }

  // ---- Utilidades ----

  private async get(sesion: Sesion, ruta: string): Promise<any> {
    const respuesta = await this.http.get(`${API_URL}${ruta}`, {
      params: { usuarioId: sesion.usuarioId },
      headers: { Authorization: `Bearer ${sesion.token}` }
    });
    await this.esperar(respuesta, 200);
    return respuesta.json();
  }

  private async post(sesion: Sesion, ruta: string, data: unknown): Promise<any> {
    const respuesta = await this.http.post(`${API_URL}${ruta}`, {
      params: { usuarioId: sesion.usuarioId },
      headers: { Authorization: `Bearer ${sesion.token}` },
      data
    });
    await this.esperar(respuesta, 201);
    return respuesta.json();
  }

  private async esperar(respuesta: { status(): number; text(): Promise<string>; url(): string },
                        codigo: number): Promise<void> {
    if (respuesta.status() !== codigo) {
      throw new Error(`Preparación E2E: ${respuesta.url()} respondió ${respuesta.status()}: ${await respuesta.text()}`);
    }
    expect(respuesta.status()).toBe(codigo);
  }
}
