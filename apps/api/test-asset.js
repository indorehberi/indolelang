const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const user = await prisma.users.findFirst();
    if (!user) {
      console.log('No user found'); return;
    }
    const asset = await prisma.assets.create({
      data: {
        provider_id: user.id,
        category: 'car',
        title: 'Test',
        base_price: 1000,
        status: 'pending'
      }
    });
    console.log(asset);
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
