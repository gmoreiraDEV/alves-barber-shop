-- CreateTable
CREATE TABLE "BarberAbsence" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarberAbsence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BarberAbsence_barberId_startAt_idx" ON "BarberAbsence"("barberId", "startAt");

-- AddForeignKey
ALTER TABLE "BarberAbsence" ADD CONSTRAINT "BarberAbsence_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
