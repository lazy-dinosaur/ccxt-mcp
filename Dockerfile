FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/bin ./bin

# Default config path inside the container. Mount your config file to /config.
ENTRYPOINT ["node", "dist/index.js"]
CMD ["--config", "/config/ccxt-config.json"]
