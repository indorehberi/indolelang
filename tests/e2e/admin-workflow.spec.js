const { test, expect } = require('@playwright/test');

test.describe('Admin Panel Workflow E2E Tests', () => {
  // Use a local dev server fallback (port 3000 for Next.js admin-panel)
  test.use({ baseURL: 'http://localhost:3000' });

  test('✅ Admin dapat login, menjelajahi menu manajemen, verifikasi KYC, dan membuka Pusat Notifikasi', async ({ page }) => {
    // 1. Login Admin
    await page.goto('/login');
    await page.fill('input[placeholder*="admin"], input[type="text"]', 'admin@indo-lelang.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    // Tunggu redirect ke dashboard
    await expect(page).toHaveURL(/\/dashboard|.*dashboard.*/, { timeout: 15000 });

    // 2. Navigasi ke Halaman Cabang
    await page.goto('/branches');
    await expect(page).toHaveURL(/\/branches/);
    await expect(page.locator('h1, h2, .page-title').filter({ hasText: /Cabang|Branch/i }).first()).toBeVisible();

    // 3. Navigasi ke Halaman Verifikasi KYC
    await page.goto('/kyc/verification');
    await expect(page).toHaveURL(/\/kyc\/verification/);
    await expect(page.locator('h1, h2, .page-title').filter({ hasText: /KYC|Verifikasi/i }).first()).toBeVisible();

    // 4. Navigasi ke Halaman Manajemen Sesi
    await page.goto('/sessions');
    await expect(page).toHaveURL(/\/sessions/);
    await expect(page.locator('button, a').filter({ hasText: /Tambah Sesi|Buat Sesi|Sesi Baru/i }).first()).toBeVisible();

    // 5. Navigasi ke Halaman Pusat Notifikasi Admin
    await page.goto('/notifications');
    await expect(page).toHaveURL(/\/notifications/);
    await expect(page.locator('h1, h2, .page-title').filter({ hasText: /Pusat Notifikasi|Notifikasi/i }).first()).toBeVisible();

    // Pastikan tombol filter atau tombol tandai semua dibaca terlihat
    const markAllBtn = page.locator('button').filter({ hasText: /Tandai Semua Dibaca|Mark All/i }).first();
    await expect(markAllBtn).toBeVisible();
  });
});
