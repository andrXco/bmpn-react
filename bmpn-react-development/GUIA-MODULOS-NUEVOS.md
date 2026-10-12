# Módulos agregados (4 controladores del backend)

Siguen las convenciones del proyecto: modelos en `model/`, servicios con `catchError(manejarError)` y `usuarioActivo.crearParametros()`, componentes con `EstadoPantalla`, `ErrorDto` y `<app-mensaje-error>`, Bootstrap.

| Controlador | Archivos nuevos | Ruta(s) |
|---|---|---|
| **Sesiones** `POST /api/sesiones` | `model/sesion.ts`, `service/autenticacion.service.ts`, `component/login/`, `guard/usuario-activo.guard.ts` | `/login` |
| **Usuarios** `/api/usuarios` | `service/usuario.service.ts`, `component/usuario-lista/`, `component/usuario-form/` (+ tipos en `model/usuario.ts`) | `/usuarios`, `/usuarios/nuevo` |
| **Procesos compartidos** `/api/procesos/{id}/compartidos` | `model/proceso-compartido.ts`, `service/proceso-compartido.service.ts`, `component/proceso-compartido-lista/` | `/procesos/:procesoId/compartidos` |
| **Lanes** `/api/procesos/{id}/pools/{poolId}/lanes` | `model/lane.ts`, `service/lane.service.ts`, `component/lane-lista/`, `component/lane-form/` | `.../pools/:poolId/lanes`, `.../lanes/nuevo`, `.../lanes/:laneId/editar` |

## Archivos existentes que se modificaron
- `service/usuario-activo.service.ts`: ahora también guarda la sesión del login (`iniciarSesion`, `sesion`, `puedeAdministrarUsuarios`). `establecer`, `limpiar` y `crearParametros` siguen igual, así que los servicios anteriores no cambiaron.
- `component/navbar/`: la caja «ID de usuario» se reemplazó por el nombre y rol de la sesión, «Salir» y «Iniciar sesión»; enlace a Usuarios.
- `app.routes.ts`: rutas nuevas, y las que necesitan `?usuarioId=` ahora cuelgan de una ruta con `usuarioActivoGuard` (sin sesión → `/login`).
- `component/proceso-detalle/…html`: botón **Compartir**.
- `component/pool-lista/…html`: botón **Lanes** (no aparece en pools de sistema externo, que no admiten lanes).

## Notas de comportamiento del backend
- Usuarios y cambio de rol son solo para ADMINISTRADOR; eliminar una lane también.
- Una lane no se puede eliminar si tiene actividades, y no se repite un rol dentro de un pool.
- El selector de roles de la lane muestra los roles de **tu** empresa (hasta 100).

## Probar
Node 22.22.3+ (o 24.15+). Backend en :8080 y luego `npm install && npm start`.
Usuarios de ejemplo: `admin@bitweb.co` / `editor@bitweb.co` / `lector@bitweb.co`, clave `BitWeb2026`.
