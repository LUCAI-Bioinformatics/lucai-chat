# ---- Etapa de build de dependencias ----
FROM node:20-alpine AS deps
WORKDIR /app

# Copiamos solo los archivos de deps
COPY package*.json ./
RUN npm ci --frozen-lockfile

# ---- Etapa de build de la app ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copiamos las dependencias ya instaladas
COPY --from=deps /app/node_modules ./node_modules

# Copiamos el resto del código
COPY . .

# Build de Next.js en modo standalone
RUN npm run build && npm prune --production

# ---- Etapa de producción ----
FROM node:20-alpine AS runner
WORKDIR /app

# Copiamos la app standalone y static
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Puerto de la app
EXPOSE 3000

# Comando para correr la app
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
