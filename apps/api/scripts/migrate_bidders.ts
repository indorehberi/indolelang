import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting bidder data migration...');

  // Find all users with role 'bidder'
  const bidderUsers = await prisma.users.findMany({
    where: { role: 'bidder' },
  });

  console.log(`Found ${bidderUsers.length} users with role 'bidder'.`);

  let migratedCount = 0;

  for (const user of bidderUsers) {
    // Check if they already exist in the bidders table
    const existingBidder = await prisma.bidders.findUnique({
      where: { user_id: user.id },
    });

    if (!existingBidder) {
      await prisma.bidders.create({
        data: {
          user_id: user.id,
          status: 'aktif', // existing users were assumed to be active
          address: user.address,
          occupation: user.occupation,
          bank_name: user.bank_name,
          bank_account_no: user.bank_account_no,
          bank_account_name: user.bank_account_name,
          submitted_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      migratedCount++;
      console.log(`Migrated bidder: ${user.email}`);
    }
  }

  console.log(`Migration completed successfully! Migrated ${migratedCount} bidders.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
