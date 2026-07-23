-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "nipl_deduction" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "nipl_codes" ADD CONSTRAINT "nipl_codes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
