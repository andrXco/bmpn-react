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

El `Dockerfile` compila la aplicacion con Node y la sirve con nginx. En `nginx.conf`,
nginx devuelve `index.html` para las rutas de Angular y reenvia `/api` al backend
(`http://app:8080`, el servicio del backend en Docker Compose).

Para levantar todo junto (base de datos, API y frontend) se usa el `compose.yaml`
del repositorio `bmpn`, con las dos carpetas una al lado de la otra:

```powershell
cd ../bmpn
docker compose up -d --build --wait
```

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
