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
COPY apps/landing-web/next.config.t[s] apps/landing-web/.env* ./apps/landing-web/

# Install dependencies and build workspaces
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
# Only set ENV if ARG is provided, otherwise let Next.js use .env.production
ARG GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL
RUN if [ -n "$GOOGLE_CLIENT_ID" ]; then echo "NEXT_PUBLIC_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID" >> ./apps/landing-web/.env.production.local; fi

RUN npm ci
RUN npm run build -w packages/shared-types
RUN npm run build -w apps/landing-web

# Stage 2: Runner
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/landing-web/public ./apps/landing-web/public
COPY --from=builder /app/apps/landing-web/.next/standalone ./
COPY --from=builder /app/apps/landing-web/.next/static ./apps/landing-web/.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/landing-web/server.js"]
