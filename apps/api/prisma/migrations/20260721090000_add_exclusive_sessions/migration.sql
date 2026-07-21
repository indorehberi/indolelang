-- Safe Idempotent Migration for Exclusive Sessions

-- 1. AlterTable and CreateTable using PL/pgSQL block to check existence
DO $$
BEGIN
    -- Add columns to auction_sessions if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='auction_sessions' AND column_name='exclusive_provider_id') THEN
        ALTER TABLE "auction_sessions" ADD COLUMN "exclusive_provider_id" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='auction_sessions' AND column_name='is_exclusive') THEN
        ALTER TABLE "auction_sessions" ADD COLUMN "is_exclusive" BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='auction_sessions' AND column_name='registration_lead_hours') THEN
        ALTER TABLE "auction_sessions" ADD COLUMN "registration_lead_hours" INTEGER;
    END IF;

    -- Create table exclusive_session_registrations if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='exclusive_session_registrations') THEN
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
    END IF;
END $$;

-- 2. Create Index (PostgreSQL native IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS "exclusive_session_registrations_session_id_bidder_id_key" 
ON "exclusive_session_registrations"("session_id", "bidder_id");

-- 3. Add Foreign Keys using PL/pgSQL block to check constraint existence
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='auction_sessions_exclusive_provider_id_fkey') THEN
        ALTER TABLE "auction_sessions" ADD CONSTRAINT "auction_sessions_exclusive_provider_id_fkey" FOREIGN KEY ("exclusive_provider_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='exclusive_session_registrations_session_id_fkey') THEN
        ALTER TABLE "exclusive_session_registrations" ADD CONSTRAINT "exclusive_session_registrations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auction_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='exclusive_session_registrations_bidder_id_fkey') THEN
        ALTER TABLE "exclusive_session_registrations" ADD CONSTRAINT "exclusive_session_registrations_bidder_id_fkey" FOREIGN KEY ("bidder_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
