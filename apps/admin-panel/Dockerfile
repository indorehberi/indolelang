# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root configurations
COPY package*.json tsconfig.base.json ./
# Copy shared packages
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/shared-types/tsconfig*.json ./packages/shared-types/
COPY packages/shared-types/src/ ./packages/shared-types/src/

# Copy admin-panel
COPY apps/admin-panel/package*.json ./apps/admin-panel/
COPY apps/admin-panel/tsconfig*.json ./apps/admin-panel/
COPY apps/admin-panel/next.config.ts ./apps/admin-panel/
COPY apps/admin-panel/postcss.config.mjs ./apps/admin-panel/
COPY apps/admin-panel/eslint.config.mjs ./apps/admin-panel/
COPY apps/admin-panel/src/ ./apps/admin-panel/src/
COPY apps/admin-panel/public/ ./apps/admin-panel/public/

# Install dependencies and build workspaces
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm ci
RUN npm run build -w packages/shared-types
RUN npm run build -w apps/admin-panel

# Stage 2: Runner
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/admin-panel/public ./apps/admin-panel/public
COPY --from=builder /app/apps/admin-panel/.next/standalone ./
COPY --from=builder /app/apps/admin-panel/.next/static ./apps/admin-panel/.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/admin-panel/server.js"]
