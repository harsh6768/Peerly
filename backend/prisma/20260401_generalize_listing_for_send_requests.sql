CREATE TYPE "ListingType" AS ENUM ('tenant_replacement', 'send_request');

ALTER TABLE "Listing"
  ADD COLUMN IF NOT EXISTS "type" "ListingType" NOT NULL DEFAULT 'tenant_replacement',
  ADD COLUMN IF NOT EXISTS "fromCity" TEXT,
  ADD COLUMN IF NOT EXISTS "toCity" TEXT,
  ADD COLUMN IF NOT EXISTS "itemType" "ItemType",
  ADD COLUMN IF NOT EXISTS "requiredDate" TIMESTAMP(3);

-- ALTER TABLE "Listing"
--   ALTER COLUMN "description" DROP NOT NULL,
--   ALTER COLUMN "city" DROP NOT NULL,
--   ALTER COLUMN "locality" DROP NOT NULL,
--   ALTER COLUMN "rentAmount" DROP NOT NULL,
--   ALTER COLUMN "propertyType" DROP NOT NULL,
--   ALTER COLUMN "occupancyType" DROP NOT NULL,
--   ALTER COLUMN "moveInDate" DROP NOT NULL;

UPDATE "Listing"
SET "type" = 'tenant_replacement'
WHERE "type" IS NULL;

CREATE INDEX IF NOT EXISTS "Listing_type_status_idx" ON "Listing"("type", "status");
