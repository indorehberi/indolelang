import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const bidders = await prisma.bidders.findMany({
    include: {
      user: {
        include: {
          kyc_document: true,
        },
      },
    },
  });

  console.log('--- ALL BIDDERS ---');
  bidders.forEach((b) => {
    console.log(`Bidder ID: ${b.id}`);
    console.log(`User ID: ${b.user_id}`);
    console.log(`Status: ${b.status}`);
    console.log(`User Email: ${b.user?.email}`);
    console.log(`KYC Doc Status: ${b.user?.kyc_document?.status || 'NONE'}`);
    console.log(`KYC Doc ID: ${b.user?.kyc_document?.id || 'NONE'}`);
    console.log('-------------------');
  });

  const providers = await prisma.providers.findMany({
    include: {
      user: {
        include: {
          kyc_document: true,
        },
      },
    },
  });

  console.log('\n--- ALL PROVIDERS ---');
  providers.forEach((p) => {
    console.log(`Provider ID: ${p.id}`);
    console.log(`User ID: ${p.user_id}`);
    console.log(`Status: ${p.status}`);
    console.log(`User Email: ${p.user?.email}`);
    console.log(`KYC Doc Status: ${p.user?.kyc_document?.status || 'NONE'}`);
    console.log('-------------------');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
