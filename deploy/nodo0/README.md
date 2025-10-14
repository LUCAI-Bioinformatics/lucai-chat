# Despliegue en Nodo0

Guía rápida para levantar el frontend Next.js y el backend Express dentro del nodo0, con Traefik como reverse proxy.

## Traefik en Nodo0 (estructura actual)
- Ubicación: `~/traefik` en el host `nodo0` (usuario `dockeradmin`).
- Compose: `~/traefik/docker-compose.yml`
  - Imagen: `traefik:v2.4`
  - Puertos publicados: `80`, `443`, `8080` (dashboard/API; actualmente `insecure=true`).
  - Red externa: `web` (debe existir y es compartida por los servicios publicados).
  - Volúmenes:
    - `docker.sock` (proveedor Docker habilitado).
    - `./config/acme.json` (almacena certificados de Let’s Encrypt).
    - `./config/traefik.toml` (config principal — entrypoints y ACME resolver).
  - Flags: `--providers.docker`, `--api.insecure=true`, `--log.level=INFO`.
- Config TOML: `~/traefik/config/traefik.toml`
  - Entrypoints: `web` (`:80`) y `websecure` (`:443`).
  - CertResolver ACME: `leresolver`, challenge HTTP en `web`.
  - Logs definidos en `DEBUG` en el archivo, pero la flag CLI los fija en `INFO` (la CLI prevalece).
- Labels esperadas en los contenedores publicados detrás de Traefik:
  - `traefik.enable=true`
  - `traefik.docker.network=web`
  - `traefik.http.services.<nombre>.loadbalancer.server.port=<PUERTO_INTERNO_DEL_CONTENEDOR>`
  - `traefik.http.routers.<nombre>.rule=Host(`<dominio>` )`
  - `traefik.http.routers.<nombre>.entrypoints=websecure`
  - `traefik.http.routers.<nombre>.tls=true`
  - `traefik.http.routers.<nombre>.tls.certresolver=leresolver`

## Estructura
- `apps/frontend`: aplicación Next.js en modo `standalone`.
- `apps/backend`: API Express Typescript (usuarios + proxy al motor NL→SQL).
- `apps/sql_assistant`: servicio FastAPI que envuelve `ask.py`.
- `deploy/nodo0/docker-compose.yml`: stack listo para Traefik sobre la red externa `web`.
 - `deploy/nodo0/docker-compose.frontend-only.yml`: stack mínimo para levantar solo el frontend.

## Prerrequisitos
1. Acceder al nodo0 vía SSH con el usuario `glyco` y cambiar a `dockeradmin`.
2. Confirmar que la red docker `web` (usada por Traefik) ya existe: `docker network ls`.
3. Asegurarse de contar con credenciales válidas para Traefik/Let's Encrypt (`leresolver`).

## Levantar solo el Frontend (paso a paso)
1. Copiar el repo en `~/lucai-chat` del `dockeradmin` (o actualizarlo con `git pull`).
2. Preparar variables:
   ```bash
   cd ~/lucai-chat/deploy/nodo0
   cp .env.example .env
   ```
   - Editar `.env` y completar al menos:
     - `FRONTEND_HOST=lucai.infra.cluster.qb.fcen.uba.ar` (o el dominio asignado al front).
     - `NEXT_PUBLIC_API_BASE_URL=https://api.lucai.infra.cluster.qb.fcen.uba.ar/api` (apunta al backend futuro; el front funcionará, aunque las llamadas de chat fallen hasta que el backend exista).
3. Verificar DNS y red Traefik:
   - El `FRONTEND_HOST` debe resolver a la IP pública del nodo0.
   - La red externa `web` debe existir (`docker network ls | grep web`) y Traefik debe estar corriendo en esa red.
4. Construir e iniciar solo el frontend:
   ```bash
   docker compose -f docker-compose.frontend-only.yml build
   docker compose -f docker-compose.frontend-only.yml up -d
   ```
5. Validación:
   - Logs del front: `docker compose -f docker-compose.frontend-only.yml logs -f frontend`
   - Traefik: `cd ~/traefik && docker compose logs --tail=50 -f`
   - Asegurar que el puerto 80 es accesible externamente (ACME http-01) para que se emita el certificado.
6. Probar acceso al sitio: `https://<FRONTEND_HOST>`

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
