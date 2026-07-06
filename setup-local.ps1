# setup-local.ps1
# Script untuk setup dev environment Indo-Lelang lokal

Write-Host "====== Indo-Lelang Local Dev Setup ======" -ForegroundColor Cyan

# 1. Pastikan Docker Daemon Aktif
Write-Host "1. Memeriksa status Docker..." -ForegroundColor Yellow
$dockerCheck = & docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Docker Daemon tidak aktif. Silakan buka aplikasi Docker Desktop di Windows Anda terlebih dahulu, lalu jalankan script ini kembali."
    Exit 1
}
Write-Host "✅ Docker Daemon aktif." -ForegroundColor Green

# 2. Jalankan PostgreSQL, Redis, dan MailHog via Docker Compose
Write-Host "2. Menjalankan database, redis, dan mailhog di Docker..." -ForegroundColor Yellow
& docker compose -f infrastructure/docker/docker-compose.yml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Gagal menjalankan docker-compose."
    Exit 1
}
Write-Host "✅ Docker containers berhasil dijalankan." -ForegroundColor Green

# 3. Jalankan Prisma Migration & Seed
Write-Host "3. Menjalankan Prisma Migrations & Seeding database..." -ForegroundColor Yellow
Push-Location apps/api

Write-Host "Menjalankan migrasi database..." -ForegroundColor Cyan
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Gagal menjalankan prisma migrate."
    Pop-Location
    Exit 1
}

Write-Host "Menjalankan db seed..." -ForegroundColor Cyan
npx prisma db seed
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Gagal menjalankan db seed."
    Pop-Location
    Exit 1
}

Pop-Location
Write-Host "✅ Database berhasil di-migrate dan di-seed." -ForegroundColor Green

Write-Host "`n====== Setup Selesai! ======" -ForegroundColor Green
Write-Host "Gunakan 'npm run dev' di root monorepo untuk menjalankan semua service." -ForegroundColor Cyan
