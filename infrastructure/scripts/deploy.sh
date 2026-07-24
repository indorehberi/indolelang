#!/bin/bash
set -e

# Setup color outputs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Starting Indo-Lelang Production Deploy ===${NC}"

# 1. Pull latest changes
echo "Pulling latest code from git..."
git pull origin main

# 2. Determine which services to build (Default: all services)
# Can be run with arguments: ./infrastructure/scripts/deploy.sh api admin
SERVICES=$*
if [ -z "$SERVICES" ]; then
    echo -e "${YELLOW}No specific service specified. Rebuilding all services (api, admin, landing)...${NC}"
    SERVICES="api admin landing"
else
    echo -e "${GREEN}Rebuilding specific service(s): $SERVICES${NC}"
fi

# 3. Build and restart Docker services (Zero-Downtime: up --build -d without down)
echo "Building production Docker containers..."
docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml up --build -d $SERVICES

# 4. Run database migrations (Only if 'api' is rebuilt or no specific services specified)
if [[ -z "$*" || "$*" == *"api"* ]]; then
    echo "Running Prisma migrations dev-deploy in api container..."
    sleep 3
    docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml exec -T api npx prisma migrate deploy
fi

# 5. Reload Nginx configuration to update container IPs in DNS cache
echo "Reloading Nginx to update upstream container IPs..."
docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml exec -T nginx nginx -s reload

# 6. Clean up old dangling images to save storage
echo "Cleaning up dangling Docker images..."
docker image prune -f

# 7. Verify service health
echo "Verifying server health checks..."
sleep 5
API_HEALTH=$(docker inspect --format='{{json .State.Health.Status}}' indolelang_api_prod || echo '"unhealthy"')
DB_HEALTH=$(docker inspect --format='{{json .State.Health.Status}}' indolelang_postgres_prod || echo '"unhealthy"')

if [ "$API_HEALTH" = '"healthy"' ] && [ "$DB_HEALTH" = '"healthy"' ]; then
    echo -e "${GREEN}=== Deploy Successful! Services are healthy. ===${NC}"
else
    echo -e "${YELLOW}Warning: Health checks failed. API: $API_HEALTH, DB: $DB_HEALTH${NC}"
    echo "Check container logs with: docker compose -f infrastructure/docker/docker-compose.prod.yml logs api"
fi
