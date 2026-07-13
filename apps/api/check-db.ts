import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  const groups = await prisma.lots.groupBy({
    by: ['status'],
    _count: {
      status: true
    }
  });

  console.log('Lots statuses:', groups);
}

checkData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
