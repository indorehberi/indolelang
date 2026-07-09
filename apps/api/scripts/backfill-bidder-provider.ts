import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Backfill data lama (kyc_documents + kolom provider_* di users) ke tabel
 * relasional baru `bidders` dan `providers`. Aman dijalankan berkali-kali
 * (idempotent lewat upsert by user_id).
 */
async function main() {
  console.log('Indo-Lelang — Backfill Bidder/Provider');
  console.log('=======================================');

  const kycDocs = await prisma.kyc_documents.findMany({ include: { user: true } });
  let bidderCount = 0;

  for (const doc of kycDocs) {
    const status = doc.status === 'approved' ? 'aktif' : doc.status === 'rejected' ? 'ditolak' : 'antri';

    await prisma.bidders.upsert({
      where: { user_id: doc.user_id },
      create: {
        user_id: doc.user_id,
        status,
        address: doc.user.address ?? undefined,
        occupation: doc.user.occupation ?? undefined,
        bank_name: doc.user.bank_name ?? undefined,
        bank_account_no: doc.user.bank_account_no ?? undefined,
        bank_account_name: doc.user.bank_account_name ?? undefined,
        rejection_reason: doc.rejection_reason ?? undefined,
        reviewed_by: doc.reviewer_id ?? undefined,
        reviewed_at: doc.reviewed_at ?? undefined,
        submitted_at: doc.created_at,
      },
      update: {
        status,
        rejection_reason: doc.rejection_reason ?? undefined,
        reviewed_by: doc.reviewer_id ?? undefined,
        reviewed_at: doc.reviewed_at ?? undefined,
      },
    });
    bidderCount++;
  }
  console.log(`Bidder rows upserted: ${bidderCount}`);

  const providerUsers = await prisma.users.findMany({
    where: { provider_status: { not: null } },
  });
  let providerCount = 0;

  for (const u of providerUsers) {
    const status = u.provider_status === 'approved' ? 'aktif' : u.provider_status === 'rejected' ? 'ditolak' : 'antri';

    await prisma.providers.upsert({
      where: { user_id: u.id },
      create: {
        user_id: u.id,
        status,
        company_name: u.company_name ?? undefined,
        npwp: u.npwp ?? undefined,
        npwp_url: u.npwp_url ?? undefined,
        pks_number: u.pks_number ?? undefined,
        provider_type: u.provider_type ?? undefined,
        provider_fee_type: u.provider_fee_type ?? undefined,
        provider_fee_amount: u.provider_fee_amount ?? undefined,
        pmk41_paid_by_provider: u.pmk41_paid_by_provider,
        address: u.address ?? undefined,
        bank_name: u.bank_name ?? undefined,
        bank_account_no: u.bank_account_no ?? undefined,
        bank_account_name: u.bank_account_name ?? undefined,
        submitted_at: u.created_at,
      },
      update: {
        status,
        company_name: u.company_name ?? undefined,
        npwp: u.npwp ?? undefined,
        npwp_url: u.npwp_url ?? undefined,
        pks_number: u.pks_number ?? undefined,
        provider_type: u.provider_type ?? undefined,
        provider_fee_type: u.provider_fee_type ?? undefined,
        provider_fee_amount: u.provider_fee_amount ?? undefined,
        pmk41_paid_by_provider: u.pmk41_paid_by_provider,
      },
    });
    providerCount++;
  }
  console.log(`Provider rows upserted: ${providerCount}`);
  console.log('Backfill selesai.');
}

main()
  .catch((e) => {
    console.error('Gagal menjalankan backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
