-- CreateTable
CREATE TABLE "transaction_profiles" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "bank_name" TEXT,
    "bank_account_no" TEXT,
    "bank_account_name" TEXT,
    "nik" TEXT,
    "company_name" TEXT,
    "npwp" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transaction_profiles_transaction_id_key" ON "transaction_profiles"("transaction_id");
