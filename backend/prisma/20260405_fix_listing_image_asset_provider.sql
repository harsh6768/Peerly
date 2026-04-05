-- Repair ListingImage.assetProvider for databases created before the column existed.
-- Safe to run multiple times.
ALTER TABLE "ListingImage"
ADD COLUMN IF NOT EXISTS "assetProvider" "AssetProvider" NOT NULL DEFAULT 'CLOUDINARY';
