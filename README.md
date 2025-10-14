# LUCAI Chat Platform

Monorepo con frontend Next.js, backend Express/SQLite y un microservicio Python (FastAPI) que encapsula el flujo `ask.py` (NL → SQL). Todo queda listo para desplegarse en el nodo0 detrás de Traefik.

## Estructura
- `apps/frontend`: aplicación Next.js 15 (`output: standalone`) más assets y estilos.
- `apps/backend`: API Express + Typescript (usuarios/SQLite, health/status y proxy al ask-service).
- `apps/sql_assistant`: FastAPI + `ask.py`, expone `/ask` para convertir una pregunta en respuesta/sentencia SQL.
- `deploy/nodo0`: archivos de despliegue (docker-compose y `.env.example`) pensados para el nodo0.

## Requisitos
- Node.js >= 20
- npm >= 10

## Instalación
Instalar dependencias por módulo:
```bash
npm install --prefix apps/frontend
npm install --prefix apps/backend
python -m venv .venv && source .venv/bin/activate  # opcional, recomendado
pip install -r apps/sql_assistant/requirements.txt
```

## Desarrollo local
- Frontend: `npm run dev --prefix apps/frontend` (http://localhost:3000)
- Backend: `npm run dev --prefix apps/backend` (http://localhost:8080 por defecto)
- Ask service: `uvicorn server:app --reload --port 9000` dentro de `apps/sql_assistant`

El backend expone `/healthz`, `/api/status`, `/api/users` y `/api/chat` (proxy al ask-service). Ajustá `CORS_ALLOW_ORIGINS` si necesitás permitir otros orígenes.

Variables de entorno sugeridas para desarrollo local:
- Backend: `ASK_SERVICE_URL=http://localhost:9000`, `DB_PATH=./data/lucai.db`.
- Frontend: `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api`.
- Ask service: `DB_URL=sqlite:///file:./data/lucai.db?mode=ro&uri=true`, además de `LLM_BASE_URL/LLM_MODEL/LLM_API_KEY`.

## Build de producción
```bash
npm run build --prefix apps/frontend
npm run build --prefix apps/backend
```
Los artefactos quedan en `apps/frontend/.next` y `apps/backend/dist`.

La base SQLite (`lucai.db`) se genera automáticamente bajo `apps/backend/data` (ignorada en git) y se comparte con el ask-service para las consultas NL→SQL.

## Docker
Cada app tiene su `Dockerfile` y `.dockerignore`. Para construir localmente:
```bash
docker build -t lucai-frontend ./apps/frontend
docker build -t lucai-backend ./apps/backend
docker build -t lucai-ask ./apps/sql_assistant
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
