# ===== Etapa 1: Compilación =====
FROM node:20 AS build
WORKDIR /app
COPY Frontend/package*.json ./Frontend/
WORKDIR /app/Frontend
RUN npm install
COPY Frontend/ ./
RUN npm run build

# ===== Etapa 2: Servidor Nginx =====
FROM nginx:latest

# Limpia los archivos por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia el contenido compilado
COPY --from=build /app/Frontend/dist/. /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

#si