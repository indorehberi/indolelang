-- Migration: change stnk_date, stnk_tax_date, and keur_date types to String (text) to support 'N/A'
-- Applied via: prisma db push (shadow DB issue workaround)

ALTER TABLE "assets" ALTER COLUMN "stnk_date" TYPE TEXT USING "stnk_date"::text;
ALTER TABLE "assets" ALTER COLUMN "stnk_tax_date" TYPE TEXT USING "stnk_tax_date"::text;
ALTER TABLE "assets" ALTER COLUMN "keur_date" TYPE TEXT USING "keur_date"::text;
