const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const setting = await prisma.platform_settings.findFirst({
    where: { key: 'auction_session_start_trigger' }
  });
  console.log('Setting:', setting);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
