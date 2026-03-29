# Listing Feature Map From Reference Screens

This note maps the provided reference screenshots to the current Trusted Network backend and calls out what we can already build, what is missing, and how the LinkedIn verification flow currently works.

## Reference screens

### Image 1

- Marketing landing page with:
- strong centered hero
- announcement pill
- product dashboard mockup
- two main CTAs

This is mostly a visual reference for the homepage and product positioning, not a database-driven listing feature.

### Image 2

- Mobile-first category launcher
- map-driven selection
- service cards
- ride confirmation pattern

For our project, this is most useful as a reference for:

- mobile home shell
- category shortcuts for housing and parcel flows
- map plus bottom-sheet interaction pattern
- sticky primary CTA

### Image 3

- property browse screen
- property detail screen
- direct chat screen

This is the strongest feature reference for the housing side because it maps directly to:

- listing discovery
- listing detail
- inquiry/chat
- trust badges
- save/share actions

## What the current backend already supports

The current data model already supports the basic housing flow well:

- listing owner
- organization-backed listing
- title and description
- city and locality
- rent and deposit
- property type and occupancy type
- move-in and move-out dates
- urgency
- contact mode
- listing status
- boosted ranking
- owner verification state
- listing inquiry
- conversation
- messages

Relevant schema pieces:

- [schema.prisma](/Users/harsh/Documents/mvp/backend/prisma/schema.prisma#L317)
- [schema.prisma](/Users/harsh/Documents/mvp/backend/prisma/schema.prisma#L383)
- [schema.prisma](/Users/harsh/Documents/mvp/backend/prisma/schema.prisma#L470)
- [schema.prisma](/Users/harsh/Documents/mvp/backend/prisma/schema.prisma#L498)

Relevant listing API code:

- [listings.service.ts](/Users/harsh/Documents/mvp/backend/src/modules/listings/listings.service.ts#L18)
- [listings.controller.ts](/Users/harsh/Documents/mvp/backend/src/modules/listings/listings.controller.ts#L14)
- [query-helpers.ts](/Users/harsh/Documents/mvp/backend/src/common/query-helpers.ts#L26)

## What is missing for a close match to Image 3

To build the property browse/detail/chat flow so it feels close to the reference, the biggest missing pieces are not the core listing table. The missing pieces are supporting metadata.

### Already present in `Listing`

These map directly today:

- `title`
- `description`
- `city`
- `locality`
- `rentAmount`
- `depositAmount`
- `propertyType`
- `occupancyType`
- `moveInDate`
- `moveOutDate`
- `urgencyLevel`
- `contactMode`
- `status`
- `isBoosted`
- `brokerAllowed`
- `ownerUserId`
- `organizationId`

### Already present in related tables

- owner identity and verification from `User`
- company and verification info from `User`
- gallery table exists as `ListingImage`
- inquiry entry point exists as `ListingInquiry`
- chat container exists as `Conversation`
- chat messages exist as `Message`

### Missing columns or models for the exact property-style UI

These are the fields I would add first.

#### Add to `Listing`

- `coverImageUrl String?`
- `bedrooms Int?`
- `bathrooms Int?`
- `areaSqft Int?`
- `furnishingStatus String?` or enum
- `listingCategory String?`
  Suggested enum values: `FULL_FLAT`, `PRIVATE_ROOM`, `SHARED_ROOM`, `PG`, `STUDIO`
- `availableFrom DateTime?`
  You can keep `moveInDate`, but `availableFrom` reads better for listing UI
- `leaseDurationMonths Int?`
- `latitude Decimal?`
- `longitude Decimal?`
- `addressLine1 String?`
- `landmark String?`
- `preferredTenantText String?`
- `parkingAvailable Boolean @default(false)`
- `petsAllowed Boolean @default(false)`
- `mealIncluded Boolean @default(false)`
- `powerBackup Boolean @default(false)`
- `wifiIncluded Boolean @default(false)`
- `genderPreference String?` or enum if needed

#### Add a new `ListingAmenity` table

Reason:
- the current screenshots show amenity chips and detail rows
- string arrays are possible in Postgres, but a separate amenity table is cleaner for filtering and admin editing

Suggested columns:

- `id`
- `listingId`
- `label`
- `iconKey String?`
- `sortOrder Int @default(0)`

#### Add a new `SavedListing` table

Reason:
- the heart/save interaction is a first-class feature in the reference

Suggested columns:

- `id`
- `userId`
- `listingId`
- `createdAt`
- unique on `userId, listingId`

#### Add a new `ListingView` or metrics table later

Reason:
- reference screens show popularity and engagement style signals
- not required for MVP

Suggested columns:

- `id`
- `listingId`
- `userId?`
- `viewedAt`
- `source String?`

#### Optional review/rating model later

Reason:
- the reference uses ratings and review counts
- your current schema has no trustworthy rating source yet

This should be phase 2, not MVP.

## Exact screen-to-schema mapping

### 1. Browse screen

Needed UI pieces:

- horizontal filters
- featured cards
- image thumbnail
- rent
- location
- bedrooms / baths / sqft
- verification badge
- save button

Backed today by:

- `Listing`
- `User`
- `ListingImage`

Still missing for a close match:

- image returned in listing API response
- `bedrooms`
- `bathrooms`
- `areaSqft`
- saved-listing relationship
- amenity/filter metadata

### 2. Property detail screen

Needed UI pieces:

- large hero image
- gallery/share/save
- rent
- address
- host info
- verified badge
- description
- amenity grid
- availability details

Backed today by:

- `Listing`
- `User`
- `ListingInquiry`

Still missing:

- full image gallery include
- richer specs
- full address fields
- amenity model
- map coordinates

### 3. Chat screen

Needed UI pieces:

- listing header
- counterpart profile
- message thread
- message input

Backed today by:

- `Conversation`
- `ConversationParticipant`
- `Message`
- `ListingInquiry`

This part of the schema is actually in decent shape already.

## Important backend gap in the current listing API

The schema has `ListingImage`, but the current `listingInclude` does not fetch images at all.

See:

- [query-helpers.ts](/Users/harsh/Documents/mvp/backend/src/common/query-helpers.ts#L26)

That means the frontend cannot yet render real property cards like the reference because it receives owner and organization data, but not gallery images.

## Recommended MVP column set

If we want the fastest path to a close match with the screenshots, I would add only this first batch:

### `Listing`

- `coverImageUrl`
- `bedrooms`
- `bathrooms`
- `areaSqft`
- `furnishingStatus`
- `listingCategory`
- `latitude`
- `longitude`
- `addressLine1`
- `landmark`
- `wifiIncluded`
- `powerBackup`
- `parkingAvailable`
- `petsAllowed`

### New tables

- `ListingAmenity`
- `SavedListing`

That is enough to support:

- browse cards
- detail page
- save/heart
- amenity chips
- richer filters

## Suggested build order

### Phase 1

- return real listings from API to frontend instead of seeded `designSystem` data
- include listing images in the API
- add `coverImageUrl`, `bedrooms`, `bathrooms`, `areaSqft`
- add `SavedListing`

### Phase 2

- add `ListingAmenity`
- add map coordinates
- add stronger mobile detail page
- connect `ListingInquiry` to `Conversation`

### Phase 3

- add review/rating model
- add listing analytics
- add recommendation scoring and better filters

## LinkedIn verification flow: what it does today

Current flow:

1. User signs in with Google.
2. User opens Trust Center.
3. User submits a LinkedIn profile URL to `POST /verification/linkedin/submit`.
4. Backend validates that the URL hostname is `linkedin.com`.
5. Backend updates the user:
   - stores `linkedinUrl`
   - sets `verificationType = LINKEDIN`
   - sets `verificationStatus = PENDING`
   - sets `isVerified = false`
6. Backend updates or creates `VerificationProfile`:
   - `linkedinVerified = false`
   - `verificationBadge = NONE`
7. Later, someone calls `POST /verification/linkedin/review` with `userId` and `APPROVED` or `REJECTED`.
8. Backend then marks the user approved or rejected and updates `VerificationProfile`.

Relevant code:

- [verification.controller.ts](/Users/harsh/Documents/mvp/backend/src/modules/verification/verification.controller.ts#L50)
- [verification.service.ts](/Users/harsh/Documents/mvp/backend/src/modules/verification/verification.service.ts#L221)
- [submit-linkedin-verification.dto.ts](/Users/harsh/Documents/mvp/backend/src/modules/verification/dto/submit-linkedin-verification.dto.ts#L4)
- [review-linkedin-verification.dto.ts](/Users/harsh/Documents/mvp/backend/src/modules/verification/dto/review-linkedin-verification.dto.ts#L5)

## What you likely missed in LinkedIn verification

There are a few important holes in the current implementation.

### 1. `proofCode` is accepted but not stored

The DTO allows a `proofCode`, but the backend only echoes it in the response. It is not saved in the database anywhere.

See:

- [submit-linkedin-verification.dto.ts](/Users/harsh/Documents/mvp/backend/src/modules/verification/dto/submit-linkedin-verification.dto.ts#L11)
- [verification.service.ts](/Users/harsh/Documents/mvp/backend/src/modules/verification/verification.service.ts#L248)

So today, there is no durable proof trail for manual reviewers.

### 2. There is no dedicated review record or audit log

The review endpoint updates the `User` and `VerificationProfile`, but it does not persist:

- who reviewed it
- when it was reviewed
- review notes
- proof snapshot

This means the manual review process exists in logic, but not as a reliable workflow record.

### 3. The review endpoint is not protected by auth or admin role

`POST /verification/linkedin/review` currently has no guard at all.

See:

- [verification.controller.ts](/Users/harsh/Documents/mvp/backend/src/modules/verification/verification.controller.ts#L62)

So anyone who can hit the endpoint can approve or reject a LinkedIn verification. This is the biggest issue in the current flow.

### 4. URL validation is minimal

It checks hostname only. It does not verify:

- `/in/...` style profile path
- existence of the profile
- whether the proof code exists in the bio

That may be acceptable for MVP, but it is manual-review-only, not automatic verification.

## Recommended LinkedIn verification fix

For MVP, I would add a dedicated table like `LinkedinVerificationSubmission`.

Suggested columns:

- `id`
- `userId`
- `linkedinUrl`
- `proofCode`
- `status`
- `submittedAt`
- `reviewedAt`
- `reviewedByUserId`
- `reviewNotes`
- `snapshotUrl` or `proofText`

Then:

- `submit` creates a submission row
- reviewer sees pending submissions
- `review` updates the submission row and then updates `User` and `VerificationProfile`
- admin guard is required on the review endpoint

## Bottom line

Yes, you can build a housing experience very close to Image 3 with your current backend as a base.

The schema is already strong enough for:

- listings
- owners
- verification badges
- inquiries
- conversations
- messages

The main missing pieces are:

- richer listing attributes
- listing images in API responses
- amenities
- saved listings
- a real LinkedIn review record and admin-protected review flow
