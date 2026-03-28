# Trusted Network Backend Blueprint

## Goal

Define a backend that supports:

- trusted user identity
- tenant listing flows
- sender/traveler matching
- urgent response flows
- direct communication
- parcel tracking later

Related docs:

- [PostgreSQL vs MySQL](./database-comparison.md)
- [MVP Schema Design](./mvp-schema-design.md)
- [Prisma schema draft](../backend/prisma/schema.prisma)

## Product domains

The backend should be split into clear modules from day one.

### Core modules

- Auth
- Users
- Organizations
- Verification
- Listings
- Traveler Routes
- Shipment Requests
- Matches
- Conversations
- Notifications
- Moderation

### Future modules

- Parcel Tracking
- Payments
- Featured Listings
- Furniture Resale
- Admin Analytics

## Recommended NestJS module layout

```text
backend/
  src/
    auth/
    users/
    organizations/
    verification/
    listings/
    traveler-routes/
    shipment-requests/
    matches/
    conversations/
    notifications/
    moderation/
    common/
    config/
    prisma/
```

## Core domain model

## 1. Users

Represents a person using the platform.

Suggested fields:

- `id`
- `full_name`
- `email`
- `phone`
- `avatar_url`
- `home_city`
- `bio`
- `is_active`
- `created_at`
- `updated_at`

## 2. Organizations

Represents a company, community, or network boundary.

Suggested fields:

- `id`
- `name`
- `domain`
- `type`
- `city`
- `is_verified_network`
- `created_at`

## 3. UserOrganizationMembership

Links users to trusted networks.

Suggested fields:

- `id`
- `user_id`
- `organization_id`
- `role`
- `status`
- `joined_at`

## 4. VerificationProfile

Stores the trust layer.

Suggested fields:

- `id`
- `user_id`
- `company_email_verified`
- `linkedin_verified`
- `government_id_verified`
- `verification_badge`
- `trust_score`
- `last_verified_at`

## 5. Listing

Housing or tenant replacement listing.

Suggested fields:

- `id`
- `owner_user_id`
- `organization_id`
- `title`
- `description`
- `city`
- `locality`
- `rent_amount`
- `deposit_amount`
- `property_type`
- `occupancy_type`
- `move_in_date`
- `move_out_date`
- `urgency_level`
- `contact_mode`
- `status`
- `broker_allowed`
- `created_at`
- `updated_at`

## 6. ListingImage

- `id`
- `listing_id`
- `image_url`
- `sort_order`

## 7. TravelerRoute

Travel post created by a traveler.

Suggested fields:

- `id`
- `user_id`
- `organization_id`
- `source_city`
- `destination_city`
- `travel_date`
- `travel_time_window`
- `capacity_type`
- `capacity_notes`
- `allowed_item_types`
- `status`
- `created_at`

## 8. ShipmentRequest

Request posted by a sender.

Suggested fields:

- `id`
- `user_id`
- `organization_id`
- `source_city`
- `destination_city`
- `pickup_area`
- `dropoff_area`
- `required_by`
- `item_type`
- `item_size`
- `item_weight_kg`
- `special_handling_notes`
- `urgency_level`
- `status`
- `created_at`

## 9. Match

Represents a possible or accepted connection between a route and a request, or a listing and a renter inquiry.

Suggested fields:

- `id`
- `match_type`
- `left_entity_type`
- `left_entity_id`
- `right_entity_type`
- `right_entity_id`
- `score`
- `status`
- `created_at`

## 10. Conversation

Suggested fields:

- `id`
- `conversation_type`
- `created_by_user_id`
- `status`
- `created_at`

## 11. ConversationParticipant

- `id`
- `conversation_id`
- `user_id`
- `joined_at`

## 12. Message

- `id`
- `conversation_id`
- `sender_user_id`
- `body`
- `message_type`
- `created_at`

## 13. Report

For trust and safety.

- `id`
- `reported_by_user_id`
- `entity_type`
- `entity_id`
- `reason`
- `status`
- `created_at`

## 14. ParcelTrackingEvent

Future-facing model for delivery tracking.

- `id`
- `shipment_request_id`
- `match_id`
- `event_type`
- `event_label`
- `event_location`
- `event_time`
- `notes`

This is why the current frontend stack is still valid: parcel tracking is mainly a backend and domain-model problem, not a React problem.

## Service boundaries

### Auth service

- login
- email verification
- session issuance
- workspace or organization discovery

### Verification service

- badge assignment
- trust score rules
- verification checks

### Listing service

- create listing
- update listing
- publish listing
- archive listing
- listing search and filters

### Traveler route service

- create route
- update route
- search routes
- archive route

### Shipment request service

- create request
- update request
- search requests
- archive request

### Match service

- compute match candidates
- surface best matches
- manage match lifecycle

### Conversation service

- create chat
- send message
- list conversations
- unread counts

### Notification service

- email alerts
- in-app alerts
- new match notifications
- urgent reminders

## Recommended API surface

## Auth

- `POST /auth/request-magic-link`
- `POST /auth/verify-magic-link`
- `GET /me`

## Listings

- `POST /listings`
- `GET /listings`
- `GET /listings/:id`
- `PATCH /listings/:id`
- `POST /listings/:id/images`
- `POST /listings/:id/archive`

## Traveler routes

- `POST /traveler-routes`
- `GET /traveler-routes`
- `GET /traveler-routes/:id`
- `PATCH /traveler-routes/:id`
- `POST /traveler-routes/:id/archive`

## Shipment requests

- `POST /shipment-requests`
- `GET /shipment-requests`
- `GET /shipment-requests/:id`
- `PATCH /shipment-requests/:id`
- `POST /shipment-requests/:id/archive`

## Matches

- `GET /matches`
- `GET /matches/:id`
- `POST /matches/:id/accept`
- `POST /matches/:id/reject`

## Conversations

- `GET /conversations`
- `GET /conversations/:id/messages`
- `POST /conversations`
- `POST /conversations/:id/messages`

## Verification

- `GET /verification/me`
- `POST /verification/company-email/request`
- `POST /verification/linkedin/connect`

## Suggested implementation order

### Phase 1

- Auth
- Users
- Organizations
- Verification
- Listings

This is enough to ship the first tenant MVP.

### Phase 2

- Traveler routes
- Shipment requests
- Matches
- Conversations

This unlocks the Send Item flow.

### Phase 3

- Notifications
- Moderation
- Admin tooling

### Phase 4

- Parcel tracking events
- featured listings
- monetization

## Suggested Prisma starting entities

If you start with Prisma right away, define these models first:

- User
- Organization
- UserOrganizationMembership
- VerificationProfile
- Listing
- ListingImage
- TravelerRoute
- ShipmentRequest
- Match
- Conversation
- ConversationParticipant
- Message

## Recommendation summary

If you want to start backend now, this is the most practical path:

1. Build NestJS + Prisma + PostgreSQL
2. Start with auth, verification, and listings
3. Add route and shipment modules second
4. Add matching and conversations after the core records exist
5. Keep parcel tracking as a future module with a clean event model

This gives you a backend that matches the actual product idea, not just the current UI demo.
