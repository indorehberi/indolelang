const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Live Bidding Room & Control Panel (Multi-User)', () => {
  test('✅ Operator memulai lot, Bidder 1 & 2 bersaing, operator ketok palu, pemenang terbit Invoice', async () => {
    // Launch browser instances
    const browser = await chromium.launch();

    // 1. Setup contexts
    const adminContext = await browser.newContext();
    const bidder1Context = await browser.newContext();
    const bidder2Context = await browser.newContext();

    const adminPage = await adminContext.newPage();
    const bidder1Page = await bidder1Context.newPage();
    const bidder2Page = await bidder2Context.newPage();

    // 2. Log in Admin
    await adminPage.goto('/login');
    await adminPage.fill('input[type="email"]', 'admin@indo-lelang.com');
    await adminPage.fill('input[type="password"]', 'Admin123!');
    await adminPage.click('button[type="submit"]');
    await expect(adminPage).toHaveURL(/\/dashboard|.*dashboard.*/);

    // 3. Log in Bidder 1 & Bidder 2
    const loginUser = async (page, email) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button[type="submit"]');
    };

    await loginUser(bidder1Page, 'bidder1@example.com');
    await loginUser(bidder2Page, 'bidder2@example.com');

    // 4. Admin navigasi ke halaman Ruang Kontrol Lelang
    await adminPage.goto('/auction/control-room');
    await expect(adminPage.locator('#lot-status, .lot-status, text=Siap|Ready|Draft')).first().toBeVisible();

    // 5. Bidder 1 & 2 navigasi ke Ruang Lelang Sesi
    await bidder1Page.goto('/auction/room');
    await bidder2Page.goto('/auction/room');

    // 6. Admin mengaktifkan Lot Pertama
    const startLotBtn = adminPage.locator('#btn-start-lot, button:has-text("Mulai"), button:has-text("Start")').first();
    await startLotBtn.click();
    await expect(adminPage.locator('.lot-status, text=Aktif|Live|Berjalan')).first().toBeVisible();

    // 7. Bidder 1 submit Bid Pertama
    const bidBtn1 = bidder1Page.locator('#btn-bid, button:has-text("Bid")').first();
    await expect(bidBtn1).toBeVisible();
    await bidBtn1.click();
    
    // Konfirmasi bid
    const confirmBidBtn1 = bidder1Page.locator('button:has-text("Konfirmasi"), button:has-text("Yes")').first();
    if (await confirmBidBtn1.isVisible()) {
      await confirmBidBtn1.click();
    }

    // Verifikasi harga terbaru ter-update di layar Bidder 1 dan Bidder 2
    await expect(bidder1Page.locator('#current-price, .current-price, text=Rp')).first().toBeVisible();
    const priceText = await bidder1Page.locator('#current-price, .current-price').first().innerText();
    
    await expect(bidder2Page.locator('#current-price, .current-price')).first().toContainText(priceText.substring(0, 10));

    // 8. Bidder 2 outbid Bidder 1 (mengajukan harga lebih tinggi)
    const bidBtn2 = bidder2Page.locator('#btn-bid, button:has-text("Bid")').first();
    await bidBtn2.click();
    const confirmBidBtn2 = bidder2Page.locator('button:has-text("Konfirmasi"), button:has-text("Yes")').first();
    if (await confirmBidBtn2.isVisible()) {
      await confirmBidBtn2.click();
    }

    // 9. Operator melakukan Ketok Palu (Hammer Price) untuk menyelesaikan lot
    const hammerBtn = adminPage.locator('#btn-hammer, button:has-text("Ketok Palu"), button:has-text("Hammer")').first();
    await hammerBtn.click();
    
    const confirmHammer = adminPage.locator('button:has-text("Konfirmasi"), button:has-text("Ya")').first();
    if (await confirmHammer.isVisible()) {
      await confirmHammer.click();
    }

    // 10. Verifikasi pemenang mendapatkan Invoice popup/halaman pelunasan
    await expect(bidder2Page.locator('#invoice-modal, .invoice-container, text=Selamat|Invoice|Tagihan')).first().toBeVisible({ timeout: 15000 });
    
    // Verifikasi penawar kalah mendapatkan notifikasi kalah
    await expect(bidder1Page.locator('#lose-notification, text=kalah|Dimenangkan oleh')).first().toBeVisible({ timeout: 15000 });

    await browser.close();
  });
});
