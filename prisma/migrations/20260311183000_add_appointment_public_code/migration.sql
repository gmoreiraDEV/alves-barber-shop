ALTER TABLE "Appointment"
ADD COLUMN "publicCode" TEXT;

UPDATE "Appointment"
SET "publicCode" = UPPER(SUBSTRING(MD5("id"), 1, 12))
WHERE "publicCode" IS NULL;

ALTER TABLE "Appointment"
ALTER COLUMN "publicCode" SET NOT NULL;

CREATE UNIQUE INDEX "Appointment_publicCode_key" ON "Appointment"("publicCode");
