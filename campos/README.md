# Campos

Sistema con dos módulos: **Venta de Agua y Gas** y **Carwash** (próximamente).
Mismo stack que gaveclean: React + Vite (frontend) + Express (backend) + MongoDB.

## Diferencia clave vs gaveclean
Este proyecto usa **MongoDB LOCAL** (instalado en el servidor con aaPanel), no MongoDB Atlas.
La conexión se configura con la variable de entorno `MONGO_URL` (ver `.env.example`).

## Desarrollo local
```bash
npm install
npm run dev        # frontend en modo desarrollo (puerto 5173)
node server.cjs     # backend (puerto 3002)
```

## Build para producción
```bash
npm install
npm run build        # genera /dist
node server.cjs       # sirve /dist + API en un solo puerto
```

## Despliegue en aaPanel (resumen)
1. Instalar MongoDB en el servidor (vía App Store de aaPanel o manualmente) si aún no está instalado.
2. Crear el sitio `campos.tudominio.com` en aaPanel (Website → Add site), tipo Node.js.
3. Clonar/subir este repo a la carpeta del sitio.
4. Crear archivo `.env` en la raíz basado en `.env.example`.
5. Ejecutar `npm install && npm run build`.
6. Configurar el gestor de procesos de Node en aaPanel (PM2) para correr `server.cjs` en el puerto definido (ej. 3002).
7. Configurar el proxy reverso del sitio para apuntar al puerto de Node (Nginx reverse proxy, se hace desde el propio panel de "Website" → "Node Project").
8. Activar SSL (Let's Encrypt) desde aaPanel para `https://campos.tudominio.com`.

## Estructura
```
src/
  pages/Home.jsx            → selector Agua-Gas / Carwash
  modules/aguagas/           → Dashboard, Inventario, Ventas, Balance
  modules/carwash/           → placeholder (siguiente etapa)
server.cjs                  → API Express + MongoDB local
```
