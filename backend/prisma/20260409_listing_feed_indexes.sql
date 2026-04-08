-- Listing feed: filter + sort paths (public browse, owner dashboard)

CREATE INDEX IF NOT EXISTS "Listing_type_status_createdAt_id_idx"
  ON "Listing"("type", "status", "createdAt" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "Listing_type_status_city_createdAt_idx"
  ON "Listing"("type", "status", "city", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Listing_ownerUserId_status_updatedAt_idx"
  ON "Listing"("ownerUserId", "status", "updatedAt" DESC);

CREATE INDEX IF NOT EXISTS "Listing_rent_filter_idx"
  ON "Listing"("status", "type", "rentAmount")
  WHERE "rentAmount" IS NOT NULL;
