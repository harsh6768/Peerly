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
- `GET /housing-needs`
- `GET /housing-needs/:id`
- `POST /housing-needs`
- `PATCH /housing-needs/:id`
- `GET /traveler-routes`
- `GET /traveler-routes/:id`
- `POST /traveler-routes`
- `PATCH /traveler-routes/:id`
- `GET /shipment-requests`
- `GET /shipment-requests/:id`
- `POST /shipment-requests`
- `PATCH /shipment-requests/:id`

## What each module represents

- `auth`: exchanges a Supabase Google session for an app session and stores the app user profile
- `verification`: optional trust layer for work email OTP verification, LinkedIn review, and trust metrics
- `listings`: replacement-tenant posts for rooms, flats, and 2BHK listings
- `housing-needs`: users searching for a flat, 2BHK, or room in an existing flat
- `traveler-routes`: users posting travel plans between cities
- `shipment-requests`: users asking for help sending or bringing items between cities

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

Example:

```bash
curl "http://localhost:4000/api/listings?city=Bengaluru&status=PUBLISHED"
```

### Housing needs

- `city`
- `status`

Example:

```bash
curl "http://localhost:4000/api/housing-needs?city=Bengaluru&status=OPEN"
```

### Traveler routes

- `sourceCity`
- `destinationCity`
- `status`

Example:

```bash
curl "http://localhost:4000/api/traveler-routes?sourceCity=Bengaluru&destinationCity=Delhi"
```

### Shipment requests

- `sourceCity`
- `destinationCity`
- `status`

Example:

```bash
curl "http://localhost:4000/api/shipment-requests?sourceCity=Delhi&destinationCity=Bengaluru"
```

## Sample payloads

### 1. Post a replacement-tenant listing

```json
{
  "ownerUserId": "USER_ID",
  "organizationId": "ORG_ID",
  "title": "Replacement tenant needed for furnished 2BHK in HSR Layout",
  "description": "Looking for a replacement tenant for a semi-furnished 2BHK near HSR Layout Sector 2.",
  "city": "Bengaluru",
  "locality": "HSR Layout",
  "rentAmount": 36000,
  "depositAmount": 120000,
  "propertyType": "APARTMENT",
  "occupancyType": "SHARED",
  "moveInDate": "2026-04-05T00:00:00.000Z",
  "moveOutDate": "2026-04-02T00:00:00.000Z",
  "urgencyLevel": "IMMEDIATE",
  "contactMode": "WHATSAPP",
  "status": "PUBLISHED",
  "isBoosted": true,
  "brokerAllowed": false
}
```

### 2. Post a housing need for a 2BHK or room in 2BHK

```json
{
  "userId": "USER_ID",
  "organizationId": "ORG_ID",
  "city": "Bengaluru",
  "locality": "Koramangala",
  "preferredPropertyType": "APARTMENT",
  "preferredOccupancy": "SHARED",
  "maxRentAmount": 28000,
  "moveInDate": "2026-04-10T00:00:00.000Z",
  "urgencyLevel": "THIS_WEEK",
  "preferredContactMode": "WHATSAPP",
  "notes": "Searching for either a full 2BHK flat or a room in an existing 2BHK flat."
}
```

### 3. Post a traveler route from Bengaluru to Delhi

```json
{
  "userId": "USER_ID",
  "organizationId": "ORG_ID",
  "sourceCity": "Bengaluru",
  "sourceArea": "Indiranagar",
  "destinationCity": "Delhi",
  "destinationArea": "South Delhi",
  "travelDate": "2026-04-08T00:00:00.000Z",
  "travelTimeWindow": "Evening flight",
  "capacityType": "SMALL_BAG",
  "capacityNotes": "Can carry documents and lightweight packages.",
  "allowedItemTypes": ["DOCUMENTS", "ELECTRONICS", "CLOTHING"],
  "status": "PUBLISHED"
}
```

### 4. Post a shipment request from Delhi to Bengaluru for documents

```json
{
  "userId": "USER_ID",
  "organizationId": "ORG_ID",
  "sourceCity": "Delhi",
  "sourceArea": "Nehru Place",
  "destinationCity": "Bengaluru",
  "destinationArea": "Koramangala",
  "requiredBy": "2026-04-16T00:00:00.000Z",
  "itemType": "DOCUMENTS",
  "itemSize": "SMALL",
  "itemWeightKg": 0.35,
  "specialHandlingNotes": "Looking for help bringing signed documents from Delhi to Bengaluru.",
  "urgencyLevel": "THIS_WEEK",
  "quotedBudget": 600,
  "prohibitedItemConfirmed": true,
  "status": "OPEN"
}
```

## Seeded local data

The backend seeds demo data on first boot when the database is empty.

Seeded examples include:

- one replacement-tenant listing in Bengaluru
- one housing-need post for a 2BHK or room in Bengaluru
- one traveler route from Bengaluru to Delhi
- one traveler route from Delhi to Bengaluru
- one shipment request from Bengaluru to Delhi
- one shipment request from Delhi to Bengaluru for documents

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
