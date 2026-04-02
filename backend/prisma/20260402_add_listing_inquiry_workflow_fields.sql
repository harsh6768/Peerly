ALTER TABLE "ListingInquiry"
  ADD COLUMN IF NOT EXISTS "budgetAmount" INTEGER,
  ADD COLUMN IF NOT EXISTS "preferredMoveInDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "preferredOccupancy" "OccupancyType",
  ADD COLUMN IF NOT EXISTS "preferredVisitAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "preferredVisitNote" TEXT,
  ADD COLUMN IF NOT EXISTS "scheduledVisitAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "scheduledVisitNote" TEXT;

CREATE INDEX IF NOT EXISTS "ListingInquiry_listingOwnerUserId_status_createdAt_idx"
  ON "ListingInquiry"("listingOwnerUserId", "status", "createdAt");
