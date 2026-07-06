#!/bin/bash
set -e

# Setup color outputs
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}=== Starting Indo-Lelang Production Deploy ===${NC}"

# 1. Pull latest changes
echo "Pulling latest code from git..."
git pull origin main

# 2. Build and restart Docker services
echo "Building production Docker containers..."
docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml down
docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml up --build -d

# 3. Run database migrations
echo "Running Prisma migrations dev-deploy in api container..."
docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml exec -T api npx prisma migrate deploy

# 4. Verify service health
echo "Verifying server health checks..."
sleep 5
API_HEALTH=$(docker inspect --format='{{json .State.Health.Status}}' indolelang_api_prod || echo '"unhealthy"')
DB_HEALTH=$(docker inspect --format='{{json .State.Health.Status}}' indolelang_postgres_prod || echo '"unhealthy"')

if [ "$API_HEALTH" = '"healthy"' ] && [ "$DB_HEALTH" = '"healthy"' ]; then
    echo -e "${GREEN}=== Deploy Successful! Services are healthy. ===${NC}"
else
    echo "Warning: Health checks failed. API: $API_HEALTH, DB: $DB_HEALTH"
    echo "Check container logs with: docker compose logs api"
fi
