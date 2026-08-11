-- Migration: add display_name to testimonials, make user_id nullable
-- Applied via: prisma db push (shadow DB issue workaround)

ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "display_name" TEXT;
ALTER TABLE "testimonials" ALTER COLUMN "user_id" DROP NOT NULL;
