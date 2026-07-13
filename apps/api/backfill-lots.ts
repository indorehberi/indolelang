import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { paymentsService } from './src/modules/payments/payments.service';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function backfillLots() {
  console.log('Using DB:', process.env.DATABASE_URL);
  console.log('Mencari lots dengan status "sold" yang belum memiliki data settlement...');
  
  // Ambil semua lot terjual
  const soldLots = await prisma.lots.findMany({
    where: {
      status: 'sold'
    },
    include: {
      settlements: true,
      invoices: true
    }
  });
  
  const missing = soldLots.filter((lot: any) => !lot.settlements || lot.settlements.length === 0);

  console.log(`Ditemukan ${missing.length} lot sold tanpa settlement.`);
  console.log(`Dari ${missing.length} lot tersebut, yang punya invoice: ${missing.filter((l: any) => l.invoices && l.invoices.length > 0).length}`);

  let count = 0;
  for (const lot of missing) {
    if (lot.invoices && lot.invoices.length > 0) {
        try {
          await paymentsService.createSettlementForInvoice(lot.invoices[0].id);
          console.log(`✅ Sukses generate settlement untuk lot ${lot.id} melalui invoice ${lot.invoices[0].id}`);
          count++;
        } catch (e: any) {
          console.error(`❌ Gagal generate lot ${lot.id}:`, e.message);
        }
    } else {
        console.log(`⚠️ Lot ${lot.id} terjual tapi TIDAK punya invoice!`);
    }
  }

  console.log(`\nSelesai! Berhasil membuat ${count} data settlement.`);
}

backfillLots()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
