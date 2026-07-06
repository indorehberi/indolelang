-- DropForeignKey
ALTER TABLE "deposits" DROP CONSTRAINT "deposits_session_id_fkey";

-- AlterTable
ALTER TABLE "deposits" ALTER COLUMN "session_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auction_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
