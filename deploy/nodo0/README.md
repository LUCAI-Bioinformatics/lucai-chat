# Despliegue en Nodo0

Guía rápida para levantar el frontend Next.js y el backend Express dentro del nodo0, con Traefik como reverse proxy.

## Estructura
- `apps/frontend`: aplicación Next.js en modo `standalone`.
- `apps/backend`: API Express Typescript (usuarios + proxy al motor NL→SQL).
- `apps/sql_assistant`: servicio FastAPI que envuelve `ask.py`.
- `deploy/nodo0/docker-compose.yml`: stack listo para Traefik sobre la red externa `web`.

## Prerrequisitos
1. Acceder al nodo0 vía SSH con el usuario `glyco` y cambiar a `dockeradmin`.
2. Confirmar que la red docker `web` (usada por Traefik) ya existe: `docker network ls`.
3. Asegurarse de contar con credenciales válidas para Traefik/Let's Encrypt (`leresolver`).

## Paso a paso
1. Copiar el repositorio en `/home/dockeradmin/lucai-chat` (o actualizarlo vía `git pull`).
2. Crear el archivo de variables:
   ```bash
   cd /home/dockeradmin/lucai-chat/deploy/nodo0
   cp .env.example .env
   ```
3. Editar `.env` con los dominios definitivos. Por ejemplo:
   ```env
   FRONTEND_HOST=lucai.infra.cluster.qb.fcen.uba.ar
   BACKEND_HOST=api.lucai.infra.cluster.qb.fcen.uba.ar
   NEXT_PUBLIC_API_BASE_URL=https://api.lucai.infra.cluster.qb.fcen.uba.ar
   CORS_ALLOW_ORIGINS=https://lucai.infra.cluster.qb.fcen.uba.ar
   LLM_BASE_URL=http://nodo4:9000/v1
   LLM_MODEL=local
   LLM_API_KEY=none
   ```
   - `FRONTEND_HOST` es el dominio público que apuntará al frontend.
   - `BACKEND_HOST` es el dominio público del API (si no se desea exponerlo, quitar los labels de Traefik en el servicio `backend`).
   - `NEXT_PUBLIC_API_BASE_URL` debe coincidir con el endpoint público que usará el frontend.
4. Construir las imágenes y levantar el stack:
   ```bash
   docker compose -f docker-compose.yml build
   docker compose -f docker-compose.yml up -d
   ```
5. Ver logs y validar que Traefik vea los contenedores:
   ```bash
   docker compose -f docker-compose.yml logs -f frontend backend
   # en otra terminal, revisar Traefik
   cd /home/dockeradmin/traefik
   docker compose logs --tail=50 -f
   ```
6. Una vez verificado, acceder a `https://<FRONTEND_HOST>` para validar el sitio.
7. El servicio `ask-service` queda accesible solo dentro de la red interna de Docker (`internal`). El backend lo resuelve como `http://ask-service:9000`.

## Recursos y persistencia
- Los contenedores tienen límites de CPU/RAM para no interferir con otras apps alojadas en el nodo0. Ajustar si es necesario.
- El volumen `lucai_data` monta `/data/lucai-chat` dentro de cada servicio para almacenar `lucai.db`, que contiene la tabla de usuarios consultable tanto por el backend como por el motor NL→SQL.

## Actualizaciones
1. Obtener los últimos cambios (`git pull`).
2. Reconstruir imágenes: `docker compose -f docker-compose.yml build`.
3. Reiniciar servicios: `docker compose -f docker-compose.yml up -d`.

## Troubleshooting rápido
- Verificar que los certificados Let’s Encrypt se emitan correctamente en los logs de Traefik.
- Chequear que la red `web` esté asociada a ambos contenedores (`docker network inspect web`).
- Revisar que la variable `CORS_ALLOW_ORIGINS` incluya el dominio del frontend, evitando errores en el navegador.
