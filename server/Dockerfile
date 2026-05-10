# Multi-stage build: install + compile in builder, ship lean runtime.
# Final image runs `prisma migrate deploy` then `node dist/index.js`.

FROM node:20-alpine AS builder
WORKDIR /app

# openssl + ca-certificates needed by Prisma's query engine
RUN apk add --no-cache openssl ca-certificates

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# openssl + ca-certificates for Prisma's query engine at runtime
RUN apk add --no-cache openssl ca-certificates

# Production deps only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Generated Prisma client + compiled JS
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

# Non-root for runtime
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 4000

# Apply pending migrations on every start, then boot.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
