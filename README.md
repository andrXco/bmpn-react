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
