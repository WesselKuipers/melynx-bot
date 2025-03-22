-- CreateTable
CREATE TABLE "hunter-ids" (
    "id" TEXT NOT NULL,
    "hunterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hunter-ids_pkey" PRIMARY KEY ("id")
);
