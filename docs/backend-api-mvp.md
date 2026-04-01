# Backend API MVP

This document covers the first backend API slice for Trusted Network.

## Base URL

Local backend:

```text
http://localhost:4000/api
```

Swagger UI:

```text
http://localhost:4000/swagger
```

## Current modules

- `GET /health`
- `POST /auth/supabase/google-login`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /verification/me`
- `POST /verification/work-email/request-otp`
- `POST /verification/work-email/confirm`
- `POST /verification/linkedin/submit`
- `POST /verification/linkedin/review`
- `GET /verification/metrics`
- `GET /listings`
- `GET /listings/:id`
- `POST /listings`
- `PATCH /listings/:id`

## What each module represents

- `auth`: exchanges a Supabase Google session for an app session and stores the app user profile
- `verification`: optional trust layer for work email OTP verification, LinkedIn review, and trust metrics
- `listings`: housing-first replacement-tenant posts, including drafts, published listings, and rented state management

## Parked modules

The following modules remain in the codebase and schema history, but they are not mounted in the active app right now:

- `housing-needs`
- `traveler-routes`
- `shipment-requests`

See [Parked Delivery Module](./parked-delivery-module.md) for the recovery notes.

## Authentication and verification flow

### 1. Exchange Supabase Google login for an app session

```bash
curl -X POST "http://localhost:4000/api/auth/supabase/google-login" \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "SUPABASE_GOOGLE_ACCESS_TOKEN"
  }'
```

### 2. Request a work-email OTP

```bash
curl -X POST "http://localhost:4000/api/verification/work-email/request-otp" \
  -H "Authorization: Bearer APP_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workEmail": "name@company.com"
  }'
```

### 3. Confirm the OTP

```bash
curl -X POST "http://localhost:4000/api/verification/work-email/confirm" \
  -H "Authorization: Bearer APP_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workEmail": "name@company.com",
    "otp": "123456"
  }'
```

### 4. Submit LinkedIn verification for review

```bash
curl -X POST "http://localhost:4000/api/verification/linkedin/submit" \
  -H "Authorization: Bearer APP_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "linkedinUrl": "https://www.linkedin.com/in/example-profile"
  }'
```

## Query filters

### Listings

- `city`
- `status`
- `nearby`
- `ownerUserId`

Example:

```bash
curl "http://localhost:4000/api/listings?city=Bengaluru&status=PUBLISHED"
```

Use `ownerUserId` when the housing UI needs the current user's listing feed.

```bash
curl "http://localhost:4000/api/listings?ownerUserId=USER_ID"
```

## Sample payloads

### 1. Save a draft replacement-tenant listing

```json
{
  "ownerUserId": "USER_ID",
  "title": "Private room near HSR Layout",
  "status": "DRAFT"
}
```

### 2. Publish a replacement-tenant listing

```json
{
  "ownerUserId": "USER_ID",
  "title": "Replacement tenant needed for furnished 2BHK in HSR Layout",
  "description": "Looking for a replacement tenant for a semi-furnished 2BHK near HSR Layout Sector 2.",
  "city": "Bengaluru",
  "locality": "HSR Layout",
  "locationName": "HSR Layout Sector 2, Bengaluru",
  "latitude": 12.911622,
  "longitude": 77.638862,
  "rentAmount": 36000,
  "depositAmount": 120000,
  "maintenanceAmount": 2500,
  "amenities": ["Wifi", "Parking", "Washing machine", "Fridge"],
  "propertyType": "APARTMENT",
  "occupancyType": "SHARED",
  "moveInDate": "2026-04-05T00:00:00.000Z",
  "contactMode": "WHATSAPP",
  "contactPhone": "+919876543210",
  "status": "PUBLISHED",
  "images": [
    {
      "assetProvider": "CLOUDINARY",
      "providerAssetId": "trusted-network/listings/user_123/living-room",
      "imageUrl": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      "thumbnailUrl": "https://res.cloudinary.com/demo/image/upload/w_400/sample.jpg",
      "detailUrl": "https://res.cloudinary.com/demo/image/upload/w_1200/sample.jpg"
    },
    {
      "assetProvider": "CLOUDINARY",
      "providerAssetId": "trusted-network/listings/user_123/bedroom",
      "imageUrl": "https://res.cloudinary.com/demo/image/upload/sample-2.jpg",
      "thumbnailUrl": "https://res.cloudinary.com/demo/image/upload/w_400/sample-2.jpg",
      "detailUrl": "https://res.cloudinary.com/demo/image/upload/w_1200/sample-2.jpg"
    }
  ]
}
```

### 3. Mark a listing as rented

```json
{
  "status": "FILLED"
}
```

## Seeded local data

The backend seeds demo data on first boot when the database is empty.

Seeded examples include:

- one replacement-tenant listing in Bengaluru

## Run locally

From the `backend/` folder:

```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run start:dev
```

Required backend env vars:

```text
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
PORT=4000
```

Frontend env vars:

```text
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Next backend API steps

- add archive and status transition flows
- connect auth and organization membership rules
- add inquiry and matching APIs
- add conversations and messages
- add parcel tracking event APIs
