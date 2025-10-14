# LUCAI Chat Platform

Monorepo con el frontend orientado a Next.js y un backend Express listo para integrarse en la infraestructura del cluster (Traefik en nodo0).

## Estructura
- `apps/frontend`: aplicación Next.js 15 (`output: standalone`) más assets y estilos.
- `apps/backend`: API Express + Typescript con endpoints de health/status.
- `deploy/nodo0`: archivos de despliegue (docker-compose y `.env.example`) pensados para el nodo0.

## Requisitos
- Node.js >= 20
- npm >= 10

## Instalación
Instalar dependencias por módulo:
```bash
npm install --prefix apps/frontend
npm install --prefix apps/backend
```

## Desarrollo local
- Frontend: `npm run dev --prefix apps/frontend` (http://localhost:3000)
- Backend: `npm run dev --prefix apps/backend` (http://localhost:4000 por defecto)

El backend expone `/healthz` y `/api/status`. Ajustá `CORS_ALLOW_ORIGINS` si necesitás permitir otros orígenes.

## Build de producción
```bash
npm run build --prefix apps/frontend
npm run build --prefix apps/backend
```
Los artefactos quedan en `apps/frontend/.next` y `apps/backend/dist`.

## Docker
Cada app tiene su `Dockerfile` y `.dockerignore`. Para construir localmente:
```bash
docker build -t lucai-frontend ./apps/frontend
docker build -t lucai-backend ./apps/backend
```

Para desplegar en el nodo0 y registrar rutas en Traefik, seguí `deploy/nodo0/README.md`:
```bash
cd deploy/nodo0
cp .env.example .env   # personalizar dominios y puertos
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml up -d
```

## Próximos pasos
- Conectar el backend a las fuentes de datos reales y montar el storage bajo `/data/lucai-chat` si se requiere persistencia.
- Revisar con el equipo de infraestructura los subdominios definitivos dentro de `*.infra.cluster.qb.fcen.uba.ar`.
