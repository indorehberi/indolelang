import { logger } from './logger';

/**
 * Converts HTML template markup to a PDF binary buffer.
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote'
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
      displayHeaderFooter: false,
    });

    await browser.close();
    return Buffer.from(pdf);
  } catch (err) {
    logger.error({ err }, 'Puppeteer PDF generation failed.');
    throw err;
  }
}
