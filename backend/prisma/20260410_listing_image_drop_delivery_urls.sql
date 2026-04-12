-- Drop persisted Cloudinary delivery URLs; canonical field is providerAssetId (+ assetProvider).
-- Apply only after clearing or migrating legacy rows that depended on these columns.

ALTER TABLE "ListingImage" DROP COLUMN IF EXISTS "imageUrl";
ALTER TABLE "ListingImage" DROP COLUMN IF EXISTS "thumbnailUrl";
ALTER TABLE "ListingImage" DROP COLUMN IF EXISTS "detailUrl";
