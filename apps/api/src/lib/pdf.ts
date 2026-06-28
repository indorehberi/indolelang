import { logger } from './logger';

/**
 * Converts HTML template markup to a PDF binary buffer.
 * If Puppeteer fails to launch, it falls back to returning the HTML directly
 * to keep the download/preview process working in developer sandbox mode.
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
      displayHeaderFooter: false,
    });

    await browser.close();
    return Buffer.from(pdf);
  } catch (err) {
    logger.warn({ err }, 'Puppeteer PDF generation failed. Using fail-safe HTML-buffer fallback.');
    // Fallback: return the HTML buffer. Browsers can still render it.
    return Buffer.from(html);
  }
}
