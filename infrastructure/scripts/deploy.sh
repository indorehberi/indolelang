#!/bin/bash
set -e

# Setup color outputs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Starting Indo-Lelang Production Deploy ===${NC}"

# 1. Tentukan layanan mana yang dibangun ulang.
#
# Diperiksa PALING AWAL, sebelum `git pull`. Menjalankan skrip ini tanpa
# argumen harus benar-benar tidak mengubah apa pun — termasuk tidak menarik
# kode baru ke server.
#
# Membangun ulang aplikasi frontend menghapus bundel JavaScript build
# sebelumnya — nama berkasnya berubah setiap build dan yang lama tidak
# disimpan. Peserta yang tabnya sudah terbuka sejak sebelum deploy lalu
# menekan sesuatu sesudahnya akan meminta berkas yang sudah tidak ada, dan
# melihat layar merah "Failed to load chunk". Karena itu membangun ulang
# ketiga aplikasi untuk perbaikan yang cuma menyentuh satu sisi bukan sekadar
# boros, tapi ikut menjatuhkan peserta yang tidak ada urusannya.
#
# Maka: TIDAK ADA lagi bawaan "bangun semuanya". Sebutkan layanannya.
#
#   ./infrastructure/scripts/deploy.sh api        -> perbaikan backend saja
#   ./infrastructure/scripts/deploy.sh landing    -> aplikasi peserta saja
#   ./infrastructure/scripts/deploy.sh admin      -> panel admin saja
#   ./infrastructure/scripts/deploy.sh nginx      -> perubahan nginx.conf saja
#   ./infrastructure/scripts/deploy.sh semua      -> ketiganya (setelah dipikir)
#
# Perubahan yang HANYA menyentuh nginx.conf bahkan tidak perlu membangun apa
# pun: berkas itu di-mount, jadi cukup `nginx` sebagai argumen.
SERVICES=$*
if [ -z "$SERVICES" ]; then
    echo -e "${YELLOW}Sebutkan layanan yang mau di-deploy.${NC}"
    echo ""
    echo "  api      backend (tidak mengganggu tab peserta yang sedang terbuka)"
    echo "  landing  aplikasi peserta"
    echo "  admin    panel admin — JANGAN saat lelang berjalan"
    echo "  nginx    hanya memuat ulang konfigurasi nginx"
    echo "  semua    ketiga aplikasi sekaligus"
    echo ""
    echo "Contoh: ./infrastructure/scripts/deploy.sh api"
    exit 1
fi

if [ "$SERVICES" = "semua" ]; then
    echo -e "${YELLOW}Membangun ulang KETIGA aplikasi.${NC}"
    echo -e "${YELLOW}Peserta yang tabnya sedang terbuka bisa melihat galat 'Failed to load chunk'.${NC}"
    SERVICES="api admin landing"
fi

# 'nginx' bukan layanan yang dibangun — konfigurasinya di-mount dari repo.
DEPLOY_NGINX_SAJA=false
if [ "$SERVICES" = "nginx" ]; then
    DEPLOY_NGINX_SAJA=true
    SERVICES=""
fi

[ -n "$SERVICES" ] && echo -e "${GREEN}Membangun ulang: $SERVICES${NC}"

# 2. Pull latest changes
echo "Pulling latest code from git..."
git pull origin main

# 3. Build and restart Docker services (Zero-Downtime: up --build -d without down)
if [ -n "$SERVICES" ]; then
    echo "Building production Docker containers..."
    docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml up --build -d $SERVICES
fi

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

# 5. Nginx.
#
# `nginx -s reload` TIDAK PERNAH bisa menerapkan perubahan nginx.conf di sini,
# dan kegagalannya sunyi total.
#
# Sebabnya: compose me-mount SATU BERKAS (./nginx/nginx.conf), bukan folder.
# Docker mengikat berkas itu berdasarkan identitasnya di disk. Ketika `git
# pull` memperbarui nginx.conf, git MENGGANTI berkasnya dengan berkas baru —
# dan container masih memegang yang lama. Reload membaca ulang berkas yang
# sama usangnya, melapor "berhasil", dan tidak ada yang berubah. Sudah terbukti
# menelan satu perbaikan batas unggahan tanpa pesan apa pun.
#
# Karena itu: kalau nginx.conf berubah sejak container menyala, container-nya
# yang dibuat ulang. Kalau tidak berubah, reload sudah cukup untuk menyegarkan
# alamat container.
NGINX_CONF="infrastructure/docker/nginx/nginx.conf"
COMPOSE="docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml"

konfigurasi_nginx_berubah() {
    # Bandingkan isi berkas di repo dengan yang benar-benar dibaca container.
    local di_container
    di_container=$(docker exec indolelang_nginx_prod cat /etc/nginx/nginx.conf 2>/dev/null) || return 0
    [ "$di_container" != "$(cat "$NGINX_CONF")" ]
}

if konfigurasi_nginx_berubah; then
    echo "Konfigurasi Nginx berubah — container dibuat ulang (reload saja tidak cukup)."
    # Diuji dulu memakai container sementara: konfigurasi yang salah tidak boleh
    # sempat menjatuhkan nginx yang sedang melayani.
    if $COMPOSE run --rm --no-deps -T nginx nginx -t 2>&1 | grep -q "syntax is ok"; then
        $COMPOSE up -d --force-recreate nginx
    else
        echo -e "${YELLOW}DITOLAK: nginx.conf tidak lolos uji. Nginx yang lama dibiarkan berjalan.${NC}"
        $COMPOSE run --rm --no-deps -T nginx nginx -t 2>&1 | tail -5
    fi
else
    echo "Konfigurasi Nginx tidak berubah — cukup dimuat ulang."
    $COMPOSE exec -T nginx nginx -s reload \
        || echo -e "${YELLOW}Peringatan: gagal memuat ulang Nginx. Periksa: docker exec indolelang_nginx_prod nginx -t${NC}"
fi

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
#
# DITUNGGU, bukan diperiksa sekali. Next.js butuh puluhan detik menyala setelah
# dibangun ulang, sementara health check di atas hanya menunggu API dan DB.
# Versi sebelumnya memeriksa pintu depan seketika setelah itu, lalu melaporkan
# "verifikasi belum lolos" padahal situsnya cuma belum selesai booting. Alarm
# yang berbunyi padahal tidak ada apa-apa jauh lebih berbahaya daripada tidak
# ada alarm: ia melatih orang untuk mengabaikannya.
echo "Menunggu pintu depan siap (maksimal 2 menit)..."
for _ in $(seq 1 24); do
    HTTP_UTAMA=$(curl -s -o /dev/null -w "%{http_code}" https://bidku.co.id/ || echo "000")
    HTTP_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" https://bidku.co.id/admin/login || echo "000")
    HTTP_API=$(curl -s -o /dev/null -w "%{http_code}" https://bidku.co.id/api/v1/settings/public || echo "000")
    [ "$HTTP_UTAMA" = "200" ] && [ "$HTTP_ADMIN" = "200" ] && [ "$HTTP_API" = "200" ] && break
    sleep 5
done
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
