# Parked Delivery Module Notes

This note records the delivery-related work that has been parked while Trusted Network focuses on the housing MVP first.

Date parked: April 2, 2026

## Why it was parked

The product has been narrowed to two housing use cases first:

- find a room
- list a replacement

Delivery will return later, but it is intentionally not part of the active MVP UI or mounted backend API surface right now.

## What was removed from the active app

### Frontend

- `/send-item` route was removed from the active router
- delivery navigation entries were removed from header, mobile nav, footer, and home page messaging
- the home page now points only to housing intents

### Backend

These modules are no longer mounted in `AppModule`, so their APIs are inactive:

- `HousingNeedsModule`
- `TravelerRoutesModule`
- `ShipmentRequestsModule`

Swagger was also updated so the active API description reflects the housing-only MVP.

## What was intentionally preserved

- Prisma schema keys were not removed
- delivery-related Prisma enums and models still exist in `backend/prisma/schema.prisma`
- delivery-related source files remain in the repository for future reuse
- `ListingType.send_request` remains in schema history, but the active listings API now rejects non-housing listing types

## Files to revisit when delivery returns

### Frontend

- `frontend/src/pages/SendItemPage.tsx`
- `frontend/src/App.tsx`
- `frontend/src/components/AppShell.tsx`
- `frontend/src/components/AppFooter.tsx`
- `frontend/src/pages/HomePage.tsx`

### Backend

- `backend/src/app.module.ts`
- `backend/src/main.ts`
- `backend/src/modules/traveler-routes/*`
- `backend/src/modules/shipment-requests/*`
- `backend/src/modules/housing-needs/*`

## Recommended return path later

When delivery is added back:

1. remount the parked backend modules in `AppModule`
2. restore delivery routes in frontend navigation
3. reintroduce delivery only after the housing seeker/host flow is stable
4. keep delivery separated from the housing feed so the intent model stays clear
