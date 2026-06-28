import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { FEATURE_TOGGLE_DEFAULTS } from '../../../packages/shared-types/src/enums';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clear existing settings and users to prevent duplicates
  await prisma.platform_settings.deleteMany({});
  await prisma.users.deleteMany({});
  await prisma.branches.deleteMany({});

  // 2. Hash passwords
  const superadminPasswordHash = await bcrypt.hash('Superadmin123!', 10);
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);

  // 3. Create default users
  const superadmin = await prisma.users.create({
    data: {
      email: 'superadmin@indo-lelang.com',
      phone: '+628111111111',
      password_hash: superadminPasswordHash,
      full_name: 'Super Admin Indo-Lelang',
      role: 'superadmin',
      status: 'active',
    },
  });

  const admin = await prisma.users.create({
    data: {
      email: 'admin@indo-lelang.com',
      phone: '+628222222222',
      password_hash: adminPasswordHash,
      full_name: 'Admin Cabang Jakarta',
      role: 'admin',
      status: 'active',
    },
  });

  console.log('✅ Default users created:');
  console.log(`   - Superadmin: ${superadmin.email}`);
  console.log(`   - Admin: ${admin.email}`);

  // 4. Create default branches
  const branchJakarta = await prisma.branches.create({
    data: {
      tenant_id: 'default',
      name: 'Indo-Lelang Jakarta',
      city: 'Jakarta',
      address: 'Jl. Jendral Sudirman No. 21, Jakarta Selatan',
      phone: '+622155551234',
      pic_name: 'Budi Santoso',
      is_active: true,
    },
  });

  const branchSurabaya = await prisma.branches.create({
    data: {
      tenant_id: 'default',
      name: 'Indo-Lelang Surabaya',
      city: 'Surabaya',
      address: 'Jl. Basuki Rahmat No. 45, Genteng, Surabaya',
      phone: '+623155556789',
      pic_name: 'Siti Rahma',
      is_active: true,
    },
  });

  console.log('✅ Default branches created:');
  console.log(`   - Jakarta Branch ID: ${branchJakarta.id}`);
  console.log(`   - Surabaya Branch ID: ${branchSurabaya.id}`);

  // 5. Create default feature toggles from FEATURE_TOGGLE_DEFAULTS
  const settingsData: any[] = [];

  Object.entries(FEATURE_TOGGLE_DEFAULTS).forEach(([key, defaultValue]) => {
    settingsData.push({
      tenant_id: 'default',
      key: key,
      value: defaultValue ? 'true' : 'false',
      is_encrypted: false,
    });
  });

  // 6. Create default business rules/settings
  settingsData.push(
    {
      tenant_id: 'default',
      key: 'commission_percentage',
      value: '1.5', // 1.5% fee
      is_encrypted: false,
    },
    {
      tenant_id: 'default',
      key: 'tax_percentage',
      value: '11.0', // PPN 11%
      is_encrypted: false,
    },
    {
      tenant_id: 'default',
      key: 'nipl_deposit_amount',
      value: '5000000', // Rp 5.000.000 deposit per NIPL
      is_encrypted: false,
    }
  );

  // Insert all settings
  for (const setting of settingsData) {
    await prisma.platform_settings.create({
      data: setting,
    });
  }

  console.log(`✅ Default platform settings and feature flags seeded (${settingsData.length} entries).`);
  console.log('🌱 Seeding process complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
