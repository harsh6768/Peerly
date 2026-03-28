# Trusted Network Entity Relationship Diagram

This diagram is derived from the current MVP Prisma schema:

- [backend/prisma/schema.prisma](../backend/prisma/schema.prisma)

Use it as the visual reference while implementing services, repositories, and API contracts.

## Mermaid ER diagram

```mermaid
erDiagram
  User {
    string id PK
    string email
    string fullName
  }

  Organization {
    string id PK
    string slug
    string name
  }

  UserOrganizationMembership {
    string id PK
    string userId FK
    string organizationId FK
    string role
    string status
  }

  VerificationProfile {
    string id PK
    string userId FK
    string verificationBadge
    int trustScore
  }

  Listing {
    string id PK
    string ownerUserId FK
    string organizationId FK
    string title
    string status
  }

  ListingImage {
    string id PK
    string listingId FK
    string imageUrl
  }

  ListingInquiry {
    string id PK
    string listingId FK
    string requesterUserId FK
    string listingOwnerUserId FK
    string status
  }

  TravelerRoute {
    string id PK
    string userId FK
    string organizationId FK
    string sourceCity
    string destinationCity
    string status
  }

  ShipmentRequest {
    string id PK
    string userId FK
    string organizationId FK
    string sourceCity
    string destinationCity
    string status
  }

  Match {
    string id PK
    string travelerRouteId FK
    string shipmentRequestId FK
    string status
  }

  Conversation {
    string id PK
    string createdByUserId FK
    string listingInquiryId FK
    string matchId FK
    string conversationType
  }

  ConversationParticipant {
    string id PK
    string conversationId FK
    string userId FK
  }

  Message {
    string id PK
    string conversationId FK
    string senderUserId FK
    string messageType
  }

  Report {
    string id PK
    string reportedByUserId FK
    string entityType
    string entityId
  }

  ParcelTrackingEvent {
    string id PK
    string shipmentRequestId FK
    string matchId FK
    string eventType
  }

  User ||--o{ UserOrganizationMembership : belongs_to
  Organization ||--o{ UserOrganizationMembership : has_members

  User ||--o| VerificationProfile : has

  User ||--o{ Listing : owns
  Organization o|--o{ Listing : scopes
  Listing ||--o{ ListingImage : has

  Listing ||--o{ ListingInquiry : receives
  User ||--o{ ListingInquiry : creates
  User ||--o{ ListingInquiry : receives_as_owner

  User ||--o{ TravelerRoute : posts
  Organization o|--o{ TravelerRoute : scopes

  User ||--o{ ShipmentRequest : posts
  Organization o|--o{ ShipmentRequest : scopes

  TravelerRoute ||--o{ Match : generates
  ShipmentRequest ||--o{ Match : generates

  User ||--o{ Conversation : creates
  ListingInquiry o|--o| Conversation : can_create
  Match o|--o| Conversation : can_create

  Conversation ||--o{ ConversationParticipant : includes
  User ||--o{ ConversationParticipant : joins

  Conversation ||--o{ Message : contains
  User o|--o{ Message : sends

  User ||--o{ Report : files

  ShipmentRequest ||--o{ ParcelTrackingEvent : logs
  Match o|--o{ ParcelTrackingEvent : groups
```

## Reading the diagram by domain

### Trust layer

- `User`
- `Organization`
- `UserOrganizationMembership`
- `VerificationProfile`

This is the foundation for a trusted network boundary.

### Tenant replacement

- `Listing`
- `ListingImage`
- `ListingInquiry`

Listings belong to a user and may optionally belong to an organization. Inquiries connect interested users to listings.

### Send Item

- `TravelerRoute`
- `ShipmentRequest`
- `Match`

Routes and requests stay explicit, and `Match` represents the connection between them.

### Communication

- `Conversation`
- `ConversationParticipant`
- `Message`

Conversation can be attached to either a `ListingInquiry` or a `Match`, which is why chat remains usable across both product flows.

### Trust and safety

- `Report`
- `ParcelTrackingEvent`

`Report` supports moderation. `ParcelTrackingEvent` supports the future delivery-tracking timeline.

## Important design note

The current schema intentionally avoids over-generic polymorphism for the MVP.

That means:

- tenant relationships are explicit
- shipment relationships are explicit
- chat attaches to real domain records

This is better for developer readability and safer backend implementation in the early stages.
