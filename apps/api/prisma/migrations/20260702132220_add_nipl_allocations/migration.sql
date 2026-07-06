-- CreateTable
CREATE TABLE "nipl_allocations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "allocated_quantity" INTEGER NOT NULL DEFAULT 1,
    "used_quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nipl_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nipl_allocations_user_id_session_id_key" ON "nipl_allocations"("user_id", "session_id");

-- AddForeignKey
ALTER TABLE "nipl_allocations" ADD CONSTRAINT "nipl_allocations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nipl_allocations" ADD CONSTRAINT "nipl_allocations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auction_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
