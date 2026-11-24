# Etapa 1: compila la aplicacion Angular
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG ANGULAR_CONFIGURATION=production
RUN npx ng build --configuration "$ANGULAR_CONFIGURATION"

# Etapa 2: nginx sirve los archivos compilados
FROM nginx:1.27-alpine

ENV BACKEND_URL=http://host.docker.internal:8080
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/bmpn-angular/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
