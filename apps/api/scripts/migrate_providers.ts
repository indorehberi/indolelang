import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting provider data migration...');

  // Find all users with role 'provider'
  const providerUsers = await prisma.users.findMany({
    where: { role: 'provider' },
  });

  console.log(`Found ${providerUsers.length} users with role 'provider'.`);

  let migratedCount = 0;

  for (const user of providerUsers) {
    // Check if they already exist in the providers table
    const existingProvider = await prisma.providers.findUnique({
      where: { user_id: user.id },
    });

    if (!existingProvider) {
      await prisma.providers.create({
        data: {
          user_id: user.id,
          status: 'aktif', // existing users were assumed to be active
          company_name: user.full_name, // default to full name if company name is missing
          address: user.address,
          bank_name: user.bank_name,
          bank_account_no: user.bank_account_no,
          bank_account_name: user.bank_account_name,
          submitted_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      migratedCount++;
      console.log(`Migrated provider: ${user.email}`);
    }
  }

  console.log(`Migration completed successfully! Migrated ${migratedCount} providers.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
