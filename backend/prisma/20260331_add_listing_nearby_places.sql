CREATE TYPE "NearbyPlaceType" AS ENUM ('tech_park', 'company');

CREATE TABLE IF NOT EXISTS "ListingNearby" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "type" "NearbyPlaceType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ListingNearby_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ListingNearby_listingId_name_key"
  ON "ListingNearby"("listingId", "name");

CREATE INDEX IF NOT EXISTS "ListingNearby_listingId_createdAt_idx"
  ON "ListingNearby"("listingId", "createdAt");

CREATE INDEX IF NOT EXISTS "ListingNearby_name_idx"
  ON "ListingNearby"("name");

ALTER TABLE "ListingNearby"
    ADD CONSTRAINT "ListingNearby_listingId_fkey"
    FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
