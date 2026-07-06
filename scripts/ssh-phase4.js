const { Client } = require('ssh2');

const sshConfig = {
  host: '31.97.50.148',
  port: 22,
  username: 'root',
  password: 'Bidku-lelang26'
};

const seedScript = `
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('BidkuAdmin2026!', 10);
  
  await prisma.users.upsert({
    where: { email: 'admin@bidku.co.id' },
    update: {},
    create: {
      email: 'admin@bidku.co.id',
      password_hash: hashedPassword,
      full_name: 'Super Admin Indo-Lelang',
      phone: '081234567890',
      role: 'superadmin',
      status: 'approved'
    }
  });

  console.log('✅ Super Admin account seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

const commands = [
  `docker exec indolelang_api_prod npx prisma db push --accept-data-loss`,
  `cat << 'EOF' > indolelang/temp_seed.js\n${seedScript}\nEOF`,
  `docker cp indolelang/temp_seed.js indolelang_api_prod:/app/apps/api/temp_seed.js`,
  `docker exec indolelang_api_prod node temp_seed.js`,
  `rm -f indolelang/temp_seed.js scripts/ssh-phase4.js`
];

const conn = new Client();

conn.on('ready', () => {
  let i = 0;
  function executeNext() {
    if (i >= commands.length) {
      conn.end();
      return;
    }
    const cmd = commands[i];
    console.log(`\n> ${cmd.split('\n')[0]}...`);
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('close', () => {
        i++;
        executeNext();
      }).on('data', (data) => {
        process.stdout.write(data);
      }).stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });
  }
  executeNext();
}).connect(sshConfig);
