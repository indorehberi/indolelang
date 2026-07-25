import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Parse .env manually
try {
  const envPath = path.join(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.error(e);
}

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany({
    include: {
      kyc_document: true,
      bidder: true,
      provider_app: true,
    },
  });

  console.log('--- ALL USERS ---');
  users.forEach((u) => {
    console.log(`User ID: ${u.id}`);
    console.log(`Email: ${u.email}`);
    console.log(`Role: ${u.role}`);
    console.log(`Status: ${u.status}`);
    console.log(`Provider Status (user.provider_status): ${u.provider_status}`);
    console.log(`Bidder Status: ${u.bidder?.status || 'NONE'}`);
    console.log(`Provider Status (table): ${u.provider_app?.status || 'NONE'}`);
    console.log(`KYC Doc Status: ${u.kyc_document?.status || 'NONE'}`);
    console.log('-------------------');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
