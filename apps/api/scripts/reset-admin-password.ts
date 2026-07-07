import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as readline from 'readline';

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
};

async function main() {
  console.log('🔒 Indo-Lelang Admin Password Reset Utility');
  console.log('==========================================');

  const email = await question('Masukkan Email Akun (misal: superadmin@indo-lelang.com): ');
  
  if (!email) {
    console.log('❌ Email tidak boleh kosong.');
    process.exit(1);
  }

  const user = await prisma.users.findUnique({
    where: { email }
  });

  if (!user) {
    console.log(`❌ User dengan email ${email} tidak ditemukan di database.`);
    process.exit(1);
  }

  console.log(`✅ User ditemukan: ${user.full_name} (${user.role})`);
  
  const newPassword = await question('Masukkan Password Baru: ');
  
  if (!newPassword || newPassword.length < 8) {
    console.log('❌ Password baru tidak boleh kosong dan harus minimal 8 karakter.');
    process.exit(1);
  }

  const confirmPassword = await question('Konfirmasi Password Baru: ');

  if (newPassword !== confirmPassword) {
    console.log('❌ Konfirmasi password tidak cocok.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.users.update({
    where: { email },
    data: { password_hash: passwordHash }
  });

  console.log(`🎉 Berhasil! Password untuk ${email} telah direset.`);
  console.log('Silakan coba login kembali di environment production Anda.');
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    rl.close();
  });
