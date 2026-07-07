import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { FEATURE_TOGGLE_DEFAULTS } from '../../../packages/shared-types/src/enums';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting secure production database seeding...');

  // 1. Hash passwords
  const superadminPasswordHash = await bcrypt.hash('Superadmin123!', 10);
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const operatorPasswordHash = await bcrypt.hash('Operator123!', 10);

  // 2. Upsert default system users (for admin panel access)
  const superadmin = await prisma.users.upsert({
    where: { email: 'superadmin@indo-lelang.com' },
    update: {},
    create: {
      email: 'superadmin@indo-lelang.com',
      phone: '+628111111111',
      password_hash: superadminPasswordHash,
      full_name: 'Super Admin Indo-Lelang',
      role: 'superadmin',
      status: 'active',
    },
  });

  const admin = await prisma.users.upsert({
    where: { email: 'admin@indo-lelang.com' },
    update: {},
    create: {
      email: 'admin@indo-lelang.com',
      phone: '+628222222222',
      password_hash: adminPasswordHash,
      full_name: 'Admin Cabang Jakarta',
      role: 'admin',
      status: 'active',
    },
  });

  const operator = await prisma.users.upsert({
    where: { email: 'operator@indo-lelang.com' },
    update: {},
    create: {
      email: 'operator@indo-lelang.com',
      phone: '+628333333333',
      password_hash: operatorPasswordHash,
      full_name: 'Operator Lelang Utama',
      role: 'operator',
      status: 'active',
    },
  });

  console.log('✅ System staff accounts verified/upserted:');
  console.log(`   - Superadmin: ${superadmin.email}`);
  console.log(`   - Admin: ${admin.email}`);
  console.log(`   - Operator: ${operator.email}`);

  // 3. Upsert default branch
  const branchJakarta = await prisma.branches.upsert({
    where: { id: 'default-jakarta-branch-id-production' },
    create: {
      id: 'default-jakarta-branch-id-production',
      tenant_id: 'default',
      name: 'Indo-Lelang Jakarta',
      city: 'Jakarta',
      address: 'Jl. Jendral Sudirman No. 21, Jakarta Selatan',
      phone: '+622155551234',
      pic_name: 'Budi Santoso',
      is_active: true,
    },
    update: {},
  });

  console.log('✅ Default branches verified/upserted:');
  console.log(`   - Jakarta Branch ID: ${branchJakarta.id}`);

  // 4. Create default feature toggles and settings securely
  const settingsData: any[] = [];

  Object.entries(FEATURE_TOGGLE_DEFAULTS).forEach(([key, defaultValue]) => {
    settingsData.push({
      tenant_id: 'default',
      key: key,
      value: defaultValue ? 'true' : 'false',
      is_encrypted: false,
    });
  });

  // Additional feature toggles not in FEATURE_TOGGLE_DEFAULTS enum
  // (auction types, asset categories, referral program)
  const additionalToggles: Record<string, string> = {
    feat_auction_english: 'true',
    feat_auction_dutch: 'false',
    feat_auction_sealed: 'false',
    feat_auction_timed: 'false',
    feat_auction_buynow: 'false',
    feat_auction_group: 'false',
    feat_category_mobil: 'true',
    feat_category_motor: 'true',
    feat_category_properti: 'false',
    feat_category_heavy: 'false',
    feat_referral_program: 'false',
  };

  Object.entries(additionalToggles).forEach(([key, defaultValue]) => {
    settingsData.push({
      tenant_id: 'default',
      key,
      value: defaultValue,
      is_encrypted: false,
    });
  });

  settingsData.push(
    {
      tenant_id: 'default',
      key: 'commission_percentage',
      value: '1.5',
      is_encrypted: false,
    },
    {
      tenant_id: 'default',
      key: 'tax_percentage',
      value: '11.0',
      is_encrypted: false,
    },
    {
      tenant_id: 'default',
      key: 'nipl_deposit_amount',
      value: '5000000',
      is_encrypted: false,
    },
    {
      tenant_id: 'default',
      key: 'nipl_motor_deposit_amount',
      value: '1000000',
      is_encrypted: false,
    },
    {
      tenant_id: 'default',
      key: 'anti_sniping_extension_seconds',
      value: '120',
      is_encrypted: false,
    },
    {
      tenant_id: 'default',
      key: 'fee_bearer_deposit',
      value: 'bidder',
      is_encrypted: false,
    },
    {
      tenant_id: 'default',
      key: 'fee_bearer_refund',
      value: 'admin',
      is_encrypted: false,
    },
    {
      tenant_id: 'default',
      key: 'fee_bearer_pelunasan',
      value: 'bidder',
      is_encrypted: false,
    },
    {
      tenant_id: 'default',
      key: 'fee_bearer_settlement',
      value: 'provider',
      is_encrypted: false,
    }
  );

  let insertedSettingsCount = 0;
  for (const setting of settingsData) {
    const exists = await prisma.platform_settings.findFirst({
      where: { key: setting.key }
    });
    if (!exists) {
      await prisma.platform_settings.create({
        data: setting,
      });
      insertedSettingsCount++;
    }
  }

  console.log(`✅ Default platform settings and feature flags seeded (${insertedSettingsCount} new entries added).`);
  console.log('🌱 Secure production seeding process complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
