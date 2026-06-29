# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root configurations
COPY package*.json tsconfig.base.json ./
# Copy shared packages
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/shared-types/tsconfig*.json ./packages/shared-types/
COPY packages/shared-types/src/ ./packages/shared-types/src/

# Copy landing-web
COPY apps/landing-web/package*.json ./apps/landing-web/
COPY apps/landing-web/tsconfig*.json ./apps/landing-web/
COPY apps/landing-web/next.config.ts ./apps/landing-web/
COPY apps/landing-web/postcss.config.mjs ./apps/landing-web/
COPY apps/landing-web/eslint.config.mjs ./apps/landing-web/
COPY apps/landing-web/src/ ./apps/landing-web/src/
COPY apps/landing-web/public/ ./apps/landing-web/public/

# Install dependencies and build workspaces
RUN npm ci
RUN npm run build -w packages/shared-types -w apps/landing-web

# Stage 2: Runner
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/landing-web/package*.json ./apps/landing-web/
COPY --from=builder /app/apps/landing-web/.next ./apps/landing-web/.next
COPY --from=builder /app/apps/landing-web/public ./apps/landing-web/public

EXPOSE 3000
ENV NODE_ENV=production
WORKDIR /app/apps/landing-web
CMD ["npm", "run", "start"]
