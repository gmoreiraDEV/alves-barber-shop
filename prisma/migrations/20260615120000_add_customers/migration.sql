CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "normalizedPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Appointment"
ADD COLUMN "customerId" TEXT,
ADD COLUMN "customerIsNew" BOOLEAN NOT NULL DEFAULT false;

WITH raw_appointments AS (
    SELECT
        "clientName",
        "phone",
        regexp_replace("phone", '\D', '', 'g') AS "rawPhone",
        "createdAt"
    FROM "Appointment"
    WHERE regexp_replace("phone", '\D', '', 'g') <> ''
),
without_leading_zero AS (
    SELECT
        "clientName",
        "phone",
        CASE
            WHEN "rawPhone" LIKE '0%' AND length("rawPhone") > 10
                THEN substr("rawPhone", 2)
            ELSE "rawPhone"
        END AS "phoneKey",
        "createdAt"
    FROM raw_appointments
),
without_country_code AS (
    SELECT
        "clientName",
        "phone",
        CASE
            WHEN "phoneKey" LIKE '55%' AND length("phoneKey") > 11
                THEN substr("phoneKey", 3)
            ELSE "phoneKey"
        END AS "phoneKey",
        "createdAt"
    FROM without_leading_zero
),
normalized_appointments AS (
    SELECT
        "clientName",
        "phone",
        CASE
            WHEN "phoneKey" LIKE '0%' AND length("phoneKey") > 10
                THEN substr("phoneKey", 2)
            ELSE "phoneKey"
        END AS "normalizedPhone",
        "createdAt"
    FROM without_country_code
),
appointment_customers AS (
    SELECT DISTINCT ON ("normalizedPhone")
        concat('customer_', md5("normalizedPhone")) AS "id",
        "clientName" AS "name",
        "phone",
        "normalizedPhone",
        "createdAt"
    FROM normalized_appointments
    ORDER BY "normalizedPhone", "createdAt" ASC
)
INSERT INTO "Customer" (
    "id",
    "name",
    "phone",
    "normalizedPhone",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "name",
    "phone",
    "normalizedPhone",
    "createdAt",
    "createdAt"
FROM appointment_customers;

WITH raw_appointments AS (
    SELECT
        "id",
        regexp_replace("phone", '\D', '', 'g') AS "rawPhone"
    FROM "Appointment"
    WHERE regexp_replace("phone", '\D', '', 'g') <> ''
),
without_leading_zero AS (
    SELECT
        "id",
        CASE
            WHEN "rawPhone" LIKE '0%' AND length("rawPhone") > 10
                THEN substr("rawPhone", 2)
            ELSE "rawPhone"
        END AS "phoneKey"
    FROM raw_appointments
),
without_country_code AS (
    SELECT
        "id",
        CASE
            WHEN "phoneKey" LIKE '55%' AND length("phoneKey") > 11
                THEN substr("phoneKey", 3)
            ELSE "phoneKey"
        END AS "phoneKey"
    FROM without_leading_zero
),
normalized_appointments AS (
    SELECT
        "id",
        CASE
            WHEN "phoneKey" LIKE '0%' AND length("phoneKey") > 10
                THEN substr("phoneKey", 2)
            ELSE "phoneKey"
        END AS "normalizedPhone"
    FROM without_country_code
)
UPDATE "Appointment"
SET "customerId" = "Customer"."id"
FROM normalized_appointments
JOIN "Customer"
    ON normalized_appointments."normalizedPhone" = "Customer"."normalizedPhone"
WHERE "Appointment"."id" = normalized_appointments."id";

CREATE UNIQUE INDEX "Customer_normalizedPhone_key" ON "Customer"("normalizedPhone");
CREATE INDEX "Customer_createdAt_idx" ON "Customer"("createdAt");
CREATE INDEX "Appointment_customerId_idx" ON "Appointment"("customerId");

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
