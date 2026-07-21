-- AlterTable
ALTER TABLE "auction_sessions" ADD COLUMN     "exclusive_provider_id" TEXT,
ADD COLUMN     "is_exclusive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registration_lead_hours" INTEGER;

-- CreateTable
CREATE TABLE "exclusive_session_registrations" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "bidder_id" TEXT NOT NULL,
    "document_url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exclusive_session_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exclusive_session_registrations_session_id_bidder_id_key" ON "exclusive_session_registrations"("session_id", "bidder_id");

-- AddForeignKey
ALTER TABLE "auction_sessions" ADD CONSTRAINT "auction_sessions_exclusive_provider_id_fkey" FOREIGN KEY ("exclusive_provider_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exclusive_session_registrations" ADD CONSTRAINT "exclusive_session_registrations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auction_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exclusive_session_registrations" ADD CONSTRAINT "exclusive_session_registrations_bidder_id_fkey" FOREIGN KEY ("bidder_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

