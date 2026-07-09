-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "branch_id" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "photo_back" TEXT,
ADD COLUMN     "photo_engine" TEXT,
ADD COLUMN     "photo_front" TEXT,
ADD COLUMN     "photo_interior" TEXT,
ADD COLUMN     "photo_left" TEXT,
ADD COLUMN     "photo_right" TEXT,
ADD COLUMN     "photo_stnk" TEXT,
ADD COLUMN     "pool_status" TEXT DEFAULT 'in_pool',
ADD COLUMN     "rejection_reason" TEXT;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

