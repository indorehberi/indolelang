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

# 4. Skema basis data TIDAK disentuh di sini.
#
# Container API menjalankan `prisma db push` sendiri setiap kali menyala (lihat
# CMD di apps/api/Dockerfile), jadi skemanya sudah tersinkron sebelum server
# menerima permintaan pertama.
#
# Sebelumnya di sini dijalankan `prisma migrate deploy`. Itu mekanisme yang
# BERBEDA dari `db push` dan keduanya saling bertabrakan: basis data yang
# dibangun lewat db push tidak punya riwayat migrasi, sehingga migrate deploy
# mencoba menerapkan semua migrasi dari nol lalu gagal karena tabelnya sudah
# ada. Dan karena skrip ini memakai `set -e`, kegagalan di titik itu
# menghentikan seluruh sisa skrip — termasuk pemuatan ulang Nginx di bawah,
# yang berakibat situs menjawab 404 meski semua container sehat.

# 5. Muat ulang Nginx.
#
# Sejak resolver DNS dipasang di nginx.conf, ini sebenarnya tidak lagi wajib —
# Nginx menerjemahkan ulang alamat container secara berkala. Tetap dijalankan
# sebagai pengaman, dan sengaja TIDAK boleh menggagalkan deploy: kalau
# pemuatan ulang bermasalah, sisa langkah verifikasi di bawah justru yang
# paling dibutuhkan.
echo "Reloading Nginx to pick up new container addresses..."
docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml exec -T nginx nginx -s reload \
    || echo -e "${YELLOW}Peringatan: gagal memuat ulang Nginx. Periksa dengan: docker exec indolelang_nginx_prod nginx -t${NC}"

# 6. Clean up old dangling images to save storage
echo "Cleaning up dangling Docker images..."
docker image prune -f

# 7. Verify service health.
#
# Container butuh waktu menyala: API menjalankan `prisma db push` dulu sebelum
# server menerima permintaan. Ditunggu sampai sehat, bukan diperiksa sekali
# setelah jeda tetap yang bisa saja terlalu pendek.
echo "Verifying server health checks..."
for _ in $(seq 1 20); do
    API_HEALTH=$(docker inspect --format='{{json .State.Health.Status}}' indolelang_api_prod 2>/dev/null || echo '"unknown"')
    DB_HEALTH=$(docker inspect --format='{{json .State.Health.Status}}' indolelang_postgres_prod 2>/dev/null || echo '"unknown"')
    [ "$API_HEALTH" = '"healthy"' ] && [ "$DB_HEALTH" = '"healthy"' ] && break
    sleep 5
done

# Pemeriksaan yang paling menentukan: apakah situsnya benar-benar terbuka dari
# luar. Container yang sehat pun pernah menyajikan 404 karena Nginx menunjuk
# alamat container yang sudah usang — hanya pemeriksaan lewat pintu depan yang
# bisa menangkap itu.
echo "Verifying public endpoints..."
HTTP_UTAMA=$(curl -s -o /dev/null -w "%{http_code}" https://bidku.co.id/ || echo "000")
HTTP_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" https://bidku.co.id/admin/login || echo "000")
HTTP_API=$(curl -s -o /dev/null -w "%{http_code}" https://bidku.co.id/api/v1/settings/public || echo "000")
echo "  utama: $HTTP_UTAMA | admin: $HTTP_ADMIN | api: $HTTP_API"

if [ "$API_HEALTH" = '"healthy"' ] && [ "$DB_HEALTH" = '"healthy"' ] \
   && [ "$HTTP_UTAMA" = "200" ] && [ "$HTTP_ADMIN" = "200" ] && [ "$HTTP_API" = "200" ]; then
    echo -e "${GREEN}=== Deploy Successful! Services are healthy. ===${NC}"
else
    echo -e "${YELLOW}PERINGATAN: verifikasi belum lolos.${NC}"
    echo "  Container  -> API: $API_HEALTH, DB: $DB_HEALTH"
    echo "  Pintu depan-> utama: $HTTP_UTAMA, admin: $HTTP_ADMIN, api: $HTTP_API"
    echo ""
    echo "Langkah pemeriksaan:"
    echo "  Log API      : docker logs --tail 50 indolelang_api_prod"
    echo "  Uji Nginx    : docker exec indolelang_nginx_prod nginx -t"
    echo "  Muat ulang   : docker exec indolelang_nginx_prod nginx -s reload"
    echo "  Kembalikan   : git reset --hard <commit-sebelumnya> && ./infrastructure/scripts/deploy.sh"
fi
