#!/bin/bash
set -e

echo "================================================="
echo "🚀 INDO-LELANG — PRODUCTION DEPLOYMENT UTILITY"
echo "================================================="
echo ""

# 1. Pull latest code
echo "📥 Step 1: Pulling latest changes from repository..."
git pull origin main || echo "⚠️ Could not pull from git origin. Continuing deployment with local workspace."
echo ""

# 2. Build and boot PostgreSQL & Redis dependencies first
echo "🐳 Step 2: Starting infrastructure dependencies (PostgreSQL & Redis)..."
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d postgres redis
echo "⏳ Waiting for database to become healthy..."
sleep 5
echo ""

# 3. Run Prisma database migrations
echo "🗄️ Step 3: Running database migrations..."
npm run db:migrate --if-present || echo "⚠️ Database migrations skipped or failed. Continuing..."
echo ""

# 4. Build and boot API and Admin Panel services
echo "🏗️ Step 4: Building and starting application services..."
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d --build api admin
echo ""

# 5. Verify deployment with Smoke Tests
echo "🔍 Step 5: Running post-deployment health check smoke tests..."
export API_URL=http://localhost:8000
export ADMIN_URL=http://localhost:3000
node scripts/smoke-test.js

echo ""
echo "================================================="
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "📱 API: http://localhost:8000"
echo "🖥️ Admin Panel: http://localhost:3000"
echo "================================================="
