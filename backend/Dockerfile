# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY entrypoint.sh /app/entrypoint.sh
COPY .env .env 2>/dev/null || true

RUN chmod +x /app/entrypoint.sh

EXPOSE 8200

ENTRYPOINT ["/app/entrypoint.sh"]