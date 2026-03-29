-- Add ListingImage.assetProvider for existing databases that do not yet have this column.
-- This is safe to run even if the column already exists.

CREATE TYPE "AssetProvider" AS ENUM ('CLOUDINARY', 'S3');

ALTER TABLE "ListingImage"
ADD COLUMN IF NOT EXISTS "assetProvider" "AssetProvider" NOT NULL DEFAULT 'CLOUDINARY';
