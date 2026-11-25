# BPMN frontend

Aplicacion Angular del editor y visor de procesos BPMN. Consume la API REST del
repositorio [bmpn](https://github.com/andrXco/bmpn).

## Requisitos

- Node.js 22.22 o superior (o 24) con npm.
- El backend corriendo en `http://localhost:8080`.

## Desarrollo

```powershell
npm install
npm start
```

Abre `http://localhost:4200`. `proxy.conf.json` reenvia las peticiones a `/api`
hacia el backend en el puerto 8080, por eso no hace falta CORS.



Usuarios de ejemplo (datos iniciales del backend): `admin@bitweb.co`,
`editor@bitweb.co` y `lector@bitweb.co`, todos con la clave `BitWeb2026`.

El backend entrega un access token JWT al iniciar sesión. Angular lo guarda solo
en memoria, lo envía como `Authorization: Bearer` y usa la cookie `HttpOnly` del
backend para renovar la sesión cuando expira; al recargar la página intenta
restaurarla mediante el refresh token.

## Docker

El `Dockerfile` compila la aplicacion con Node y la sirve con nginx. `nginx.conf`
devuelve `index.html` para las rutas de Angular. La version compilada llama a la
API en `http://localhost:8080/api` (el backend tiene CORS para `http://localhost:4200`).

Con el backend corriendo (en su propio Docker, repositorio `bmpn`):

```powershell
docker build -t bmpn-front .
docker run -d --name bmpn-front -p 4200:80 bmpn-front
```

Abre `http://localhost:4200`.

## Pruebas

### Unitarias (Vitest)

```powershell
npm test            # modo interactivo
npm run test:ci     # una sola ejecución, como en CI
```

### Sistema / extremo a extremo (Playwright)

Las pruebas E2E están en `e2e/` (archivos `*.e2e.ts`) y usan un navegador real contra el
frontend, el backend y PostgreSQL. Cada prueba crea sus propias empresas y usuarios por la
API, así que no depende de datos previos ni deja conflictos.

Primera vez:

```powershell
npm install -D @playwright/test
npx playwright install chromium
```

Ejecución (con el backend corriendo: `docker compose up -d --wait` en el repositorio `bmpn`):

```powershell
npm run e2e           # levanta ng serve si no está corriendo y ejecuta las pruebas
npm run e2e:ui        # modo visual para depurar
npm run e2e:reporte   # abre el reporte HTML (playwright-report/)
```

Variables opcionales: `E2E_BASE_URL` (por defecto `http://localhost:4200`), `E2E_API_URL`
(por defecto `http://localhost:8080/api`) y `E2E_SIN_SERVIDOR=true` si el frontend ya corre
en Docker. En CI (`.github/workflows/ci.yml`) se levanta el backend con Docker Compose y se
publica el reporte como artefacto.

| Archivo | Flujo |
| --- | --- |
| `autenticacion.e2e.ts` | Login, error de credenciales, rutas protegidas, renovación al recargar, cookie HttpOnly, cierre de sesión |
| `procesos.e2e.ts` | Crear proceso, validación del formulario, aislamiento entre empresas, módulo de usuarios por rol |
| `editor.e2e.ts` | Editor bpmn-js: crear tarea desde la paleta, renombrar, conectar con un arco, editor sin permiso de borrado |
| `visor.e2e.ts` | Visor en solo lectura, detalle de elementos, proceso compartido (HU-23), empresa sin invitación |

## Estructura

```text
src/app/
├── model/        interfaces que reflejan los DTO del backend
├── service/      llamadas a la API con HttpClient
├── component/    pantallas y componentes
├── interceptor/  manejo global de errores HTTP
├── guard/        rutas que necesitan sesion
└── util/         funciones compartidas
```
