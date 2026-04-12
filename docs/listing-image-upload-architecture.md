# Listing Image Upload Architecture

## What We Are Solving

Replacement-tenant listings need a real flat gallery, not a single image field.

Current product rules:

- Minimum: 2 images
- Maximum: 8 images
- First image is the cover image
- Suggested order:
  - Living room
  - Bedroom
  - Kitchen
  - Bathroom
  - Balcony / view
  - Building exterior
- Optimized outputs:
  - Thumbnail: 400px
  - Detail: 800px to 1200px

## Data Model Decision

We kept `Listing` as the parent entity and used `ListingImage` as a child table.

Why this is the right choice:

- A listing can have multiple images, so one row per image maps naturally to the data.
- Each image needs its own metadata:
  - assetProvider
  - provider asset id (Cloudinary **public_id** — canonical key)
  - width / height / bytes
  - sort order
  - cover flag
- This supports future storage providers without changing the `Listing` table shape again.
- It avoids awkward columns like `image1`, `image2`, `image3`, which become brittle very quickly.

### Why Not Add Image Columns Directly To `Listing`

That approach would look simpler initially, but it breaks down fast:

- it hard-codes a fixed number of image slots
- it makes ordering harder to manage cleanly
- it mixes listing-level data with image-level data
- it becomes messy when adding provider migration, metadata, or audit support later

For a multi-image gallery, a related table is the correct design.

## Schema shape

### Target (implemented)

`ListingImage` stores:

- `assetProvider`, `providerAssetId`, `width`, `height`, `bytes`, `isCover`, `sortOrder`

Delivery URLs are **not** persisted. The web app uses `getListingImageUrl(publicId, variant)`; mobile uses the same transform pattern with `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`.

### Changelog (image track)

| Change | Description |
|--------|-------------|
| DB | Dropped `imageUrl`, `thumbnailUrl`, `detailUrl` (migration `20260410_listing_image_drop_delivery_urls.sql`). |
| API | Listing create/update images: `providerAssetId` + `assetProvider` (+ optional dimensions). |
| Upload folder | `trusted-network/listings/{userId}/{listingId}` (requires an existing listing row). |
| Composer | Save draft or publish creates the row first; pending photos upload after `listingId` exists (web + mobile). |
| Orphans | Cleanup on failed save where possible; scheduled draft purge **deferred** — see [SPRINT_SCALING_HOUSING.md](./SPRINT_SCALING_HOUSING.md). |

Full sprint plan: [SPRINT_SCALING_HOUSING.md](./SPRINT_SCALING_HOUSING.md).

## Upload Strategy Comparison

There are two common browser upload approaches with Cloudinary.

### Option 1: Unsigned Upload From Frontend

Flow:

1. Frontend uploads directly to Cloudinary using a public unsigned preset.
2. Cloudinary returns asset metadata.
3. Frontend sends resulting image metadata to the backend when the listing is created.

Pros:

- very fast to build
- no backend signing endpoint required
- good for quick prototypes

Cons:

- upload preset lives in the browser
- harder to control who can upload
- easier to abuse if preset rules are too open
- less suitable for production

### Option 2: Signed Upload With Backend Signature

Flow:

1. Authenticated frontend requests an upload signature from the backend.
2. Backend signs Cloudinary parameters using `CLOUDINARY_API_SECRET`.
3. Frontend uploads directly to Cloudinary using that signature.
4. Frontend sends returned image metadata to the listing create API.

Pros:

- Cloudinary secret stays on the backend
- upload can be restricted to authenticated users
- folder and allowed parameters are controlled server-side
- much safer for production

Cons:

- slightly more code
- requires one extra backend endpoint

## Decision

We chose signed upload with backend-assisted signing.

Reason:

- it is the safer production path
- it fits our trust-first product direction better
- it still keeps the actual file upload off our backend server

So the backend does not proxy image binaries.
It only signs the upload request.

## Current Flow In This Repo

### Backend

Endpoint:

- `POST /api/listings/upload-signature`

Rules:

- requires app session bearer token
- signs Cloudinary parameters
- request body includes **`listingId`**; listing must belong to the signed-in user
- uploads go under **`trusted-network/listings/{userId}/{listingId}`**

### Frontend

Flow on `Replace Tenant`:

1. User selects or drops images.
2. Frontend asks backend for a signed upload payload.
3. Frontend uploads each image to Cloudinary.
4. Frontend stores preview + returned asset metadata locally.
5. On listing submit, frontend sends listing data plus the ordered image metadata array.

### Listing API Validation

Backend enforces:

- at least 2 images
- at most 8 images
- first image becomes `isCover = true`
- image order is normalized by `sortOrder`

## Why We Still Upload Directly To Cloudinary

Even with signed uploads, the browser still sends the file directly to Cloudinary.

That is good because:

- backend bandwidth stays low
- uploads are faster
- backend remains responsible only for trust and metadata, not file streaming

## Future S3 Migration

We added `AssetProvider` now so we can move to S3 later without redesigning the schema.

Likely future S3 flow:

1. frontend asks backend for a pre-signed S3 upload URL
2. frontend uploads file directly to S3
3. frontend sends resulting asset metadata to listing create/update

Because provider metadata already lives on each `ListingImage`, that migration path is clean.

## Required Environment Variables

### Backend

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Frontend

No Cloudinary secret or preset is needed for the signed flow.

- **Web:** `VITE_CLOUDINARY_CLOUD_NAME` for delivery URLs (read-time transforms).
- **Mobile:** `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` for the same.

## Operational Notes

- Closing the app before saving can still leave orphans; the client calls **`cleanup-uploads`** on removal and on some save failures. A **scheduled** draft/asset purge is deferred (see [SPRINT_SCALING_HOUSING.md](./SPRINT_SCALING_HOUSING.md)).
- We currently use the first uploaded image as cover image after reordering.
- The suggested order is a UX hint only; users can still reorder manually.
