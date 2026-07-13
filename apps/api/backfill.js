const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function backfill() {
  console.log('Mencari invoice yang belum memiliki data settlement...');
  
  // Ambil semua invoice
  const invoices = await prisma.invoices.findMany({
    include: {
      lot: {
        include: {
          asset: true,
          settlements: true
        }
      }
    }
  });
  
  // Filter yang tidak punya settlement
  const missing = invoices.filter(inv => !inv.lot.settlements || inv.lot.settlements.length === 0);

  console.log(`Ditemukan ${missing.length} invoice tanpa settlement. Memulai generate...`);

  let count = 0;
  for (const invoice of missing) {
    try {
      const settlementAmount = Number(invoice.hammer_price) - Number(invoice.commission);
      
      const status = invoice.status === 'paid' ? 'pending' : 'unpaid';

      await prisma.settlements.create({
        data: {
          lot_id: invoice.lot_id,
          provider_id: invoice.lot.asset.provider_id,
          gross_amount: invoice.hammer_price,
          commission_deducted: invoice.commission,
          net_amount: settlementAmount,
          status: status,
        },
      });
      console.log(`✅ Sukses generate settlement untuk invoice ${invoice.id}`);
      count++;
    } catch (e) {
      console.error(`❌ Gagal generate invoice ${invoice.id}:`, e.message);
    }
  }

  console.log(`\nSelesai! Berhasil membuat ${count} data settlement.`);
}

backfill()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
