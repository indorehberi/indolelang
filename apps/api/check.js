const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log(await prisma.platform_settings.findMany());
}
main().finally(() => prisma.$disconnect());
