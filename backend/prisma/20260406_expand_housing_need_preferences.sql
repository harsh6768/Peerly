ALTER TABLE "HousingNeed"
ADD COLUMN IF NOT EXISTS "maxDepositAmount" INTEGER,
ADD COLUMN IF NOT EXISTS "maxMaintenanceAmount" INTEGER,
ADD COLUMN IF NOT EXISTS "preferredAmenities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE IF NOT EXISTS "HousingNeedNearby" (
    "id" TEXT NOT NULL,
    "housingNeedId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "type" "NearbyPlaceType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HousingNeedNearby_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "HousingNeedNearby_housingNeedId_createdAt_idx"
ON "HousingNeedNearby"("housingNeedId", "createdAt");

CREATE INDEX IF NOT EXISTS "HousingNeedNearby_name_idx"
ON "HousingNeedNearby"("name");

CREATE UNIQUE INDEX IF NOT EXISTS "HousingNeedNearby_housingNeedId_name_key"
ON "HousingNeedNearby"("housingNeedId", "name");


  ALTER TABLE "HousingNeedNearby"
  ADD CONSTRAINT "HousingNeedNearby_housingNeedId_fkey"
  FOREIGN KEY ("housingNeedId") REFERENCES "HousingNeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;
