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
RUN npm ci
RUN npm run build -w packages/shared-types -w apps/admin-panel

# Stage 2: Runner
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/admin-panel/package*.json ./apps/admin-panel/
COPY --from=builder /app/apps/admin-panel/.next ./apps/admin-panel/.next
COPY --from=builder /app/apps/admin-panel/public ./apps/admin-panel/public

EXPOSE 3000
ENV NODE_ENV=production
WORKDIR /app/apps/admin-panel
CMD ["npm", "run", "start"]
