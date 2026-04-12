# Sprint: Housing scale-up (listings, images, API shape)

**Status:** In execution (implementation tracked in repo)  
**Product:** Cirvo — tenant replacement & room discovery  
**Related:** [PRODUCT_OVERVIEW.md](../PRODUCT_OVERVIEW.md), [listing-image-upload-architecture.md](./listing-image-upload-architecture.md)

This sprint moves the housing product from “MVP works” to **scaling posture**: a **stable image contract**, **explicit draft vs go-live** UX, **less wasteful client loading**, and **paginated reads**. **Automated draft expiry / scheduled purge is explicitly out of scope** until you decide to add it (see [Deferred](#deferred-not-in-this-sprint)).

---

## Sprint goal

1. **Images:** Persist **`assetProvider` + `providerAssetId`** (and dimensions/metadata) as the source of truth. **Do not** treat full delivery URLs as canonical in the database. Render images via a **single URL builder** with fixed variants (**thumb / card / detail**). Use **per-listing** Cloudinary folders once a listing row exists. **Harden uploads** (path validation, cleanup on failed save where feasible).

2. **Listing lifecycle UX:** **No auto-create** of a listing when the user opens the composer. The user **explicitly** chooses **Save draft** or **Go live / Publish** (exact labels are a product copy pass). **`listingId` exists only after that action**, which unlocks signed uploads for the per-listing folder pattern.

3. **Client & API scale:** Reduce redundant refetches on tab/mode changes; introduce **pagination** (cursor or offset) on listing list endpoints; optional **lighter list DTOs** if needed.

---

## Product rules (locked for this sprint)

| Rule | Detail |
|------|--------|
| Draft vs live | User must **choose** draft or publish; **no silent draft** on screen load. |
| Images before `listingId` | With per-listing folders, **uploads start after** “Save draft” or “Publish” returns a `listingId` (first successful create). |
| Scheduler | **Not planned** in this sprint. Manual ops / future job for stale drafts + Cloudinary cleanup **documented only** in [Deferred](#deferred-not-in-this-sprint). |
| Legacy data | **No URL backfill.** Wipe or delete old listings/images before schema that drops URL columns, or run a one-off cleanup. |

---

## Image changes — summary (what this sprint delivers)

Use [listing-image-upload-architecture.md](./listing-image-upload-architecture.md) for full technical narrative. At a glance:

| Area | Before | After |
|------|--------|--------|
| DB `ListingImage` | `providerAssetId` **plus** `imageUrl`, `thumbnailUrl`, `detailUrl` | **Canonical:** `assetProvider`, `providerAssetId`, dimensions, order, cover. **Removed** persisted delivery URLs (migration after data wipe). |
| API create/update payload | Client sends three URLs per image | Client sends **provider metadata only**; server validates `providerAssetId` + provider. |
| Rendering | Components use stored thumbnail/detail URLs | **One helper** `getListingImageUrl(publicId, variant)` with fixed transforms (`f_auto`, `q_auto`, `c_limit`, `w_*`). |
| Upload folder | `cirvo/listings/{userId}` | `cirvo/listings/{userId}/{listingId}`, **after** listing exists. |
| Orphans | Upload-then-abandon leaves Cloudinary orphans | **On failed listing save:** best-effort cleanup for uploads in that session; **scheduler deferred**. |
| S3 later | `assetProvider` already exists | Same pattern: key in DB, URL at read time. |

---

## Epic map (execution order: backend contract → URL layer → UI → robustness → scale)

### Phase 1 — Backend: storage contract & API

| ID | Work item | Acceptance |
|----|-----------|------------|
| B1 | Prisma `ListingImage` — drop URL columns | Migrate applies; no code expects URL columns. |
| B2 | DTOs — images without URL fields | Swagger + validation match. |
| B3 | Listings service — persist images without URLs | Create/update with ids only. |
| B4 | Upload signature — `listingId`, folder `.../{userId}/{listingId}` | Cross-user / wrong listing → 403/404. |
| B5 | Cleanup uploads — prefix validation | Cannot delete other users’ assets. |
| B6 | Delete listing — remove Cloudinary assets | No intentional orphans for deleted listings. |

### Phase 2–6

See phase tables in git history of this file or implementation in `listings.service.ts`, `FindTenantPage.tsx`, and related modules.

---

## Definition of done (this sprint)

- [x] `ListingImage` without persisted delivery URL columns (with migration SQL for existing DBs).  
- [x] API accepts image rows keyed by **`providerAssetId`** (+ provider).  
- [x] Listing image UI uses **`getListingImageUrl`** where applicable.  
- [x] Upload signature uses **per-listing** folder with **`listingId`**.  
- [x] Composer: **explicit** draft vs publish; **no** auto-create on entry.  
- [x] Listing list API **paginated**; client **TanStack Query** + reduced redundant fetches.  
- [x] **No** scheduled draft purge in this release.

---

## Deferred (not in this sprint)

**Draft TTL + automated purge** — cron/worker, multi-instance lock, `DRAFT_RETENTION_DAYS`. Add as a follow-up sprint.

---

## References in repo

- [listing-image-upload-architecture.md](./listing-image-upload-architecture.md)  
- `backend/src/modules/listings/dto/create-listing-image.dto.ts`  
- [SPRINT_PLANNING.md](../SPRINT_PLANNING.md)
