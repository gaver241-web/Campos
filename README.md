# Campos

Sistema con dos módulos: **Venta de Agua y Gas** y **Carwash** (próximamente).
Mismo stack que gaveclean: React + Vite (frontend) + Express (backend) + MongoDB.

## Base de datos
Este proyecto usa **MongoDB Atlas** (nube), en un cluster propio (`Campos1`) **separado** del que usa gaveclean.
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
1. En MongoDB Atlas → Network Access, agregar la IP del servidor (`38.250.228.100`) para permitir la conexión.
2. Crear el sitio `campos.tudominio.com` en aaPanel (Website → Add site), tipo Node.js.
3. Clonar/subir este repo a la carpeta del sitio.
4. Crear archivo `.env` en la raíz basado en `.env.example` (con el connection string de Atlas).
5. Ejecutar `npm install && npm run build`.
6. Configurar el gestor de procesos de Node en aaPanel (PM2) para correr `server.cjs` en el puerto definido (ej. 3002).
7. Configurar el proxy reverso del sitio para apuntar al puerto de Node (Nginx reverse proxy, se hace desde el propio panel de "Website" → "Node Project").
8. Activar SSL (Let's Encrypt) desde aaPanel para `https://campos.tudominio.com`.

## Estructura
```
src/
  pages/Home.jsx            → selector Agua-Gas / Carwash
  modules/aguagas/           → Dashboard, Inventario, Ventas, Balance
  modules/carwash/           → Órdenes, caja, clientes (guarda en MongoDB vía /api/carwash)
server.cjs                  → API Express + MongoDB Atlas
```

## Carwash y la base de datos
El módulo Carwash guarda en MongoDB (colecciones `carwash_*` + `carwash_meta`) a través de `/api/carwash/*`.
Mantiene una copia en el navegador para abrir rápido y trabajar sin internet; al volver la conexión sincroniza solo.
La primera vez que se abre con la base vacía, sube lo que ya tenía guardado en ese navegador.
