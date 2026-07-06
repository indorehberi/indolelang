import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Wiping all dummy transactional data...');

  // Delete all transactional data
  await prisma.bids.deleteMany({});
  await prisma.deposits.deleteMany({});
  await prisma.invoices.deleteMany({});
  await prisma.settlements.deleteMany({});
  await prisma.documents.deleteMany({});
  await prisma.notifications.deleteMany({});
  await prisma.audit_logs.deleteMany({});
  
  // Delete auction data
  await prisma.lots.deleteMany({});
  await prisma.assets.deleteMany({});
  await prisma.auction_sessions.deleteMany({});
  
  // Delete KYC
  await prisma.kyc_documents.deleteMany({});

  // Optionally delete all bidders and providers (keep superadmin, admin, operator)
  await prisma.users.deleteMany({
    where: {
      role: {
        in: ['bidder', 'provider']
      }
    }
  });

  console.log('✅ Database is now clean and ready for real data deployment!');
}

main()
  .catch((e) => {
    console.error('❌ Wipe failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
