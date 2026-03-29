-- Add ListingImage.assetProvider for existing databases that do not yet have this column.
-- This is safe to run even if the column already exists.

CREATE TYPE "AssetProvider" AS ENUM ('CLOUDINARY', 'S3');

ALTER TABLE "ListingImage"
ADD COLUMN IF NOT EXISTS "assetProvider" "AssetProvider" NOT NULL DEFAULT 'CLOUDINARY';


ALTER TABLE "ListingImage"
ADD COLUMN IF NOT EXISTS "providerAssetId" TEXT,
ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT,
ADD COLUMN IF NOT EXISTS "detailUrl" TEXT,
ADD COLUMN IF NOT EXISTS "width" INTEGER,
ADD COLUMN IF NOT EXISTS "height" INTEGER,
ADD COLUMN IF NOT EXISTS "bytes" INTEGER,
ADD COLUMN IF NOT EXISTS "isCover" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

UPDATE "ListingImage"
SET
    "providerAssetId" = COALESCE(NULLIF("providerAssetId", ''), "id"),
    "thumbnailUrl" = COALESCE("thumbnailUrl", "imageUrl"),
    "detailUrl" = COALESCE("detailUrl", "imageUrl");

WITH ranked_images AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (PARTITION BY "listingId" ORDER BY "id") - 1 AS next_sort_order
    FROM "ListingImage"
)
UPDATE "ListingImage" AS listing_image
SET
    "sortOrder" = ranked_images.next_sort_order,
    "isCover" = ranked_images.next_sort_order = 0
FROM ranked_images
WHERE listing_image."id" = ranked_images."id";

ALTER TABLE "ListingImage"
ALTER COLUMN "providerAssetId" SET NOT NULL;

ALTER TABLE "ListingImage"
ALTER COLUMN "thumbnailUrl" SET NOT NULL;

ALTER TABLE "ListingImage"
ALTER COLUMN "detailUrl" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "ListingImage_listingId_isCover_idx"
ON "ListingImage"("listingId", "isCover");

CREATE UNIQUE INDEX IF NOT EXISTS "ListingImage_listingId_sortOrder_key"
ON "ListingImage"("listingId", "sortOrder");
