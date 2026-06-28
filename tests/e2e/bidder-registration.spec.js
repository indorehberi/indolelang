const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Alur Pendaftaran Bidder', () => {
  test.beforeAll(() => {
    // Ensure mock fixtures exist
    const fixturesDir = path.resolve(__dirname, '../fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    fs.writeFileSync(path.join(fixturesDir, 'sample-ktp.jpg'), 'fake-ktp-image-content');
    fs.writeFileSync(path.join(fixturesDir, 'sample-selfie.jpg'), 'fake-selfie-image-content');
  });

  test('✅ Bidder dapat mendaftar, isi data, upload KTP, dan menunggu verifikasi', async ({ page }) => {
    // Step 1: Buka halaman login & navigasi ke daftar
    await page.goto('/login');
    const registerLink = page.locator('a[href="/register"]').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
    } else {
      await page.goto('/register');
    }
    await expect(page).toHaveURL(/\/register/);

    // Step 2: Isi form data pribadi
    await page.fill('input[name="full_name"]', 'Budi Santoso Test');
    await page.fill('input[name="email"]', `bidder-${Date.now()}@example.com`);
    await page.fill('input[name="phone"]', '+628999999888');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirm_password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Step 3: Verifikasi masuk ke halaman upload KYC
    await expect(page).toHaveURL(/\/kyc\/upload|.*kyc.*/);
    
    // Upload files
    const ktpInput = page.locator('input[type="file"]#ktp, input[type="file"]#ktp_url, input[type="file"]');
    await ktpInput.first().setInputFiles(path.resolve(__dirname, '../fixtures/sample-ktp.jpg'));
    
    const selfieInput = page.locator('input[type="file"]#selfie, input[type="file"]#selfie_url').first();
    if (await selfieInput.isVisible()) {
      await selfieInput.setInputFiles(path.resolve(__dirname, '../fixtures/sample-selfie.jpg'));
    }
    
    await page.click('button[type="submit"], #btn-submit-kyc');

    // Step 4: Verifikasi status menunggu verifikasi
    await expect(page.locator('#status-verification, .kyc-status, text=Menunggu')).toBeVisible({ timeout: 10000 });
  });
});
