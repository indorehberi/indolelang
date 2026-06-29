# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root configurations
COPY package*.json tsconfig.base.json ./
# Copy workspace packages
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/shared-types/tsconfig*.json ./packages/shared-types/
COPY packages/shared-types/src/ ./packages/shared-types/src/

COPY packages/utils/package*.json ./packages/utils/
COPY packages/utils/tsconfig*.json ./packages/utils/
COPY packages/utils/src/ ./packages/utils/src/

# Copy api configs
COPY apps/api/package*.json ./apps/api/
COPY apps/api/tsconfig*.json ./apps/api/
COPY apps/api/prisma/ ./apps/api/prisma/
COPY apps/api/src/ ./apps/api/src/

# Install dependencies
RUN npm ci

# Generate prisma client
WORKDIR /app/apps/api
RUN npx prisma generate
WORKDIR /app

# Build shared packages & api
RUN npm run build -w packages/shared-types
RUN npm run build -w packages/utils
RUN npm run build -w apps/api

# Stage 2: Runner
FROM node:20-alpine
WORKDIR /app

# Copy built package artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/package*.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

EXPOSE 8000
ENV NODE_ENV=production
WORKDIR /app/apps/api
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
