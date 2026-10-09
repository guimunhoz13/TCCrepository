# syntax=docker/dockerfile:1
# O frontend do LexOffice usa Node 22, a mesma versão da CI do projeto.
FROM node:22-slim AS deps
WORKDIR /app

# Separar o lockfile do código permite reutilizar a camada de dependências.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* é incorporada ao JavaScript no build, não no docker run.
# Se usar a API real, informe um endereço alcançável pelo navegador.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_OUTPUT=standalone
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# O servidor standalone contém só as dependências necessárias para executar.
# Os assets e a pasta public precisam ser copiados separadamente.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

# Executar sem privilégios de root reduz o impacto de uma falha no processo.
USER node
EXPOSE 3000

# Verificação sem curl/wget: usa o próprio Node da imagem.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
