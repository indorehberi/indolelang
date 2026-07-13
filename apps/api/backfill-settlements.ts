import { PrismaClient } from '@prisma/client';
import { paymentsService } from './src/modules/payments/payments.service';

const prisma = new PrismaClient();

async function backfill() {
  console.log('Mencari invoice yang belum memiliki data settlement...');
  
  // Ambil semua invoice beserta relasi lot -> settlements
  const invoices = await prisma.invoices.findMany({
    include: {
      lot: {
        include: {
          settlements: true
        }
      }
    }
  });
  
  // Filter yang lot-nya tidak punya settlement
  const missing = invoices.filter((inv: any) => !inv.lot.settlements || inv.lot.settlements.length === 0);

  console.log(`Ditemukan ${missing.length} invoice tanpa settlement. Memulai generate...`);

  let count = 0;
  for (const inv of missing) {
    try {
      await paymentsService.createSettlementForInvoice(inv.id);
      console.log(`✅ Sukses generate settlement untuk invoice ${inv.id}`);
      count++;
    } catch (e: any) {
      console.error(`❌ Gagal generate invoice ${inv.id}:`, e.message);
    }
  }

  console.log(`\nSelesai! Berhasil membuat ${count} data settlement.`);
}

backfill()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
