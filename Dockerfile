# Étape de base (pour le développement et la production)
FROM node:22.11-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Étape de dev (pour le développement avec hot-reloading)
FROM base AS dev
ENV NODE_OPTIONS="--max-old-space-size=2048"
CMD ["npm", "run", "start:dev:with-seed"]

# Étape de prod (pour la production)
FROM base AS prod
RUN npm run build
ENV NODE_OPTIONS="--max-old-space-size=2048"
CMD ["npm", "run", "start"]