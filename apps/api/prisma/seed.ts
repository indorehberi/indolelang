import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { FEATURE_TOGGLE_DEFAULTS } from '../../../packages/shared-types/src/enums';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding (Production/Clean Mode)...');

  // 1. Clear existing tables in correct dependency order
  await prisma.documents.deleteMany({});
  await prisma.nipl_codes.deleteMany({});
  await prisma.invoices.deleteMany({});
  await prisma.checkout_orders.deleteMany({});
  await prisma.referral_usages.deleteMany({});
  await prisma.referrals.deleteMany({});
  await prisma.settlements.deleteMany({});
  await prisma.bids.deleteMany({});
  await prisma.lots.deleteMany({});
  await prisma.exclusive_session_registrations.deleteMany({});
  await prisma.nipl_allocations.deleteMany({});
  await prisma.assets.deleteMany({});
  await prisma.auction_sessions.deleteMany({});
  await prisma.branches.deleteMany({});
  await prisma.kyc_documents.deleteMany({});
  await prisma.bidders.deleteMany({});
  await prisma.providers.deleteMany({});
  await prisma.blog_posts.deleteMany({});
  await prisma.testimonials.deleteMany({});
  await prisma.audit_logs.deleteMany({});
  await prisma.deposits.deleteMany({});
  await prisma.notifications.deleteMany({});
  await prisma.users.deleteMany({});
  await prisma.platform_settings.deleteMany({});
  await prisma.campaigns.deleteMany({});
  await prisma.contact_messages.deleteMany({});
  await prisma.galleries.deleteMany({});
  await prisma.transaction_profiles.deleteMany({});


  // 2. Hash passwords
  const superadminPasswordHash = await bcrypt.hash('Superadmin123!', 10);
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const operatorPasswordHash = await bcrypt.hash('Operator123!', 10);

  // 3. Create default system users (for admin panel access)
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

  const operator = await prisma.users.create({
    data: {
      email: 'operator@indo-lelang.com',
      phone: '+628333333333',
      password_hash: operatorPasswordHash,
      full_name: 'Operator Lelang Utama',
      role: 'operator',
      status: 'active',
    },
  });

  console.log('✅ Default system staff accounts created:');
  console.log(`   - Superadmin: ${superadmin.email}`);
  console.log(`   - Admin: ${admin.email}`);
  console.log(`   - Operator: ${operator.email}`);

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

  console.log('✅ Default branches created:');
  console.log(`   - Jakarta Branch ID: ${branchJakarta.id}`);

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

  // Additional feature toggles (auction types, asset categories, referral)
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
    },
    {
      tenant_id: 'default',
      key: 'nipl_motor_deposit_amount',
      value: '1000000',
      is_encrypted: false,
    },
    {
      tenant_id: 'default',
      key: 'auction_lot_duration_secs',
      value: '120',
      is_encrypted: false,
    },
    {
      tenant_id: 'default',
      key: 'auction_lot_second_duration_secs',
      value: '60',
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
    },
    {
      tenant_id: 'default',
      key: 'referral_reward_amount',
      value: '100000',
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

  console.log('🌱 Seeding process complete! Database is now clean.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
