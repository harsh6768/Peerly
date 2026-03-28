# Trusted Network MVP Schema Design

## Goal

Provide a practical MVP schema direction that backend work can begin from immediately.

The first schema draft lives in:

- [backend/prisma/schema.prisma](../backend/prisma/schema.prisma)

## MVP scope covered by the schema

This schema is designed to support:

- company or community-scoped trust
- verified users
- tenant replacement listings
- traveler routes
- shipment requests
- shipment matching
- conversations and messages
- reporting and moderation hooks
- future parcel tracking extension

## Included models

### Identity and trust

- `User`
- `Organization`
- `UserOrganizationMembership`
- `VerificationProfile`

### Tenant replacement

- `Listing`
- `ListingImage`
- `ListingInquiry`

### Send Item

- `TravelerRoute`
- `ShipmentRequest`
- `Match`

### Communication

- `Conversation`
- `ConversationParticipant`
- `Message`

### Trust and safety

- `Report`

### Future extension already prepared

- `ParcelTrackingEvent`

## Why this schema is practical for the MVP

It avoids over-building while still preserving the product’s real structure.

Examples:

- Tenant replacement has direct inquiry support instead of forcing a generic marketplace abstraction too early.
- Send Item has explicit route and shipment models with a real `Match` table.
- Conversation is designed so chat can attach to either a listing inquiry or a shipment match.
- Parcel tracking is not fully implemented yet, but the event model is ready so future rollout will not require a full redesign.

## Design choices

### 1. Explicit domain models over generic polymorphism

Where possible, the schema uses concrete entities instead of abstract "thing" tables.

That makes backend code easier to reason about and safer to maintain.

### 2. Organization-aware records

Listings, routes, and shipment requests can optionally belong to an organization or network.

This supports the core product vision:

- trusted internal launch
- company-scoped visibility
- later network expansion

### 3. Verification kept separate from User

`VerificationProfile` is isolated so trust logic can evolve without bloating the core user table.

### 4. Tracking prepared, not overbuilt

`ParcelTrackingEvent` exists now because we already know tracking is a likely future module.

That gives us room to grow without pretending the MVP already has full courier-grade tracking.

## Recommended backend implementation order against this schema

### Phase 1

- `User`
- `Organization`
- `UserOrganizationMembership`
- `VerificationProfile`
- `Listing`
- `ListingImage`
- `ListingInquiry`

This is enough for the tenant replacement MVP.

### Phase 2

- `TravelerRoute`
- `ShipmentRequest`
- `Match`

This unlocks the Send Item flow.

### Phase 3

- `Conversation`
- `ConversationParticipant`
- `Message`
- `Report`

This improves trust, coordination, and moderation.

### Phase 4

- `ParcelTrackingEvent`

This unlocks tracking timelines and shipment progress later.

## Indexing notes

The Prisma draft already includes starter indexes for:

- organization membership lookup
- listing city/locality/status filtering
- route source-destination-date lookup
- shipment source-destination-requiredBy lookup
- match status lookup
- message ordering
- tracking event ordering

These will need to evolve based on real traffic, but they are a solid MVP starting point.
