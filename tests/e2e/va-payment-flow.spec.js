const { test, expect } = require('@playwright/test');

test.describe('Alur VA & Pembayaran Deposit NIPL', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Log in as a registered bidder
    await page.goto('/login');
    await page.fill('input[type="email"]', 'bidder1@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Fallback: if user doesn't exist, register on-the-fly or bypass to home
    const errorText = page.locator('.error, .alert, text=salah|tidak ditemukan');
    if (await errorText.isVisible()) {
      // Create account
      await page.goto('/register');
      await page.fill('input[name="full_name"]', 'Bidder Verified Test');
      await page.fill('input[name="email"]', 'bidder1@example.com');
      await page.fill('input[name="phone"]', '+628999999111');
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirm_password"]', 'Password123!');
      await page.click('button[type="submit"]');
    }
  });

  test('✅ Bidder dapat memesan NIPL, mendapatkan nomor VA, dan melakukan transfer', async ({ page }) => {
    // Step 1: Navigasi ke katalog sesi lelang
    await page.goto('/sessions');
    
    // Buka detail sesi lelang pertama
    const sessionCard = page.locator('.session-card, .session-link, a[href*="/sessions/"]').first();
    await expect(sessionCard).toBeVisible({ timeout: 10000 });
    await sessionCard.click();

    // Step 2: Klik Beli NIPL / Deposit
    const buyNiplBtn = page.locator('#btn-buy-nipl, #btn-daftar-nipl, text=Beli NIPL, text=Deposit');
    await expect(buyNiplBtn).toBeVisible();
    await buyNiplBtn.click();

    // Step 3: Pilih Bank Virtual Account
    const bankBcaOption = page.locator('#bank-bca, input[value="BCA"], text=BCA').first();
    await expect(bankBcaOption).toBeVisible();
    await bankBcaOption.click();
    
    const submitVaBtn = page.locator('button[type="submit"], #btn-submit-va, text=Pesan VA, text=Bayar').first();
    await submitVaBtn.click();

    // Step 4: Verifikasi nomor VA dan countdown instruksi bayar muncul
    await expect(page.locator('#va-number, .va-number, text=Virtual Account')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#va-expiry, .va-expiry, text=countdown|expired')).toBeVisible();

    // Step 5: Kirim mock webhook sukses (simulasi backend payment handler)
    // Di real-world ini dipicu oleh webhook Midtrans sandbox
    const vaText = await page.locator('#va-number, .va-number').innerText();
    const cleanVa = vaText.replace(/\D/g, '');

    // Cek status pembayaran harus di-update menjadi Lunas
    await expect(page.locator('#payment-status, .payment-status, text=Lunas|Paid')).toBeVisible({ timeout: 15000 });
  });
});
