-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "inspection_pic_name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "lots_session_id_lot_number_key" ON "lots"("session_id", "lot_number");

