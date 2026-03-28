# Trusted Network Frontend Architecture

## Goal

Keep the frontend modular, readable, and easy for future developers to change without hunting through giant page files.

## Current state

The current repo is still in early MVP mode:

- page files contain a lot of UI markup
- shared styling lives in a single global CSS file
- mock product data is centralized in `designSystem.ts`

This is acceptable for an early prototype, but not where we should stop.

## Frontend architecture principle

Use domain-oriented modularity, not file-type sprawl.

That means we group code by product area:

- home
- find-tenant
- send-item
- auth
- trust
- shared ui

## Recommended folder structure

```text
src/
  app/
    AppProviders.tsx
    router.tsx

  routes/
    AppShell.tsx

  modules/
    home/
      components/
      data/
      HomePage.tsx

    find-tenant/
      components/
        ListingCard.tsx
        ListingDetail.tsx
        FilterBar.tsx
      data/
      types.ts
      FindTenantPage.tsx

    send-item/
      components/
        RouteCard.tsx
        SendItemForm.tsx
        ModeToggle.tsx
      data/
      types.ts
      SendItemPage.tsx

    trust/
      components/
        VerifiedBadge.tsx
        TrustScore.tsx
      types.ts

  components/
    layout/
      AppFooter.tsx
      AppShell.tsx
      FooterWave.tsx
    ui/
      Badge.tsx
      Button.tsx
      Card.tsx

  data/
    designTokens.ts
    marketplaceSeed.ts

  styles/
    globals.css
    tokens.css
    utilities.css

  lib/
    formatters.ts
    constants.ts
    routes.ts

  types/
    api.ts
    domain.ts
```

## What should be shared vs module-specific

### Shared

These should stay reusable:

- `Button`
- `Card`
- `Badge`
- footer and shell layout
- typography and spacing tokens
- formatting helpers

### Module-specific

These should live inside product modules:

- tenant listing card
- tenant detail panel
- traveler route card
- send-item form
- homepage hero stats
- testimonials

Rule:

If a component only makes sense in one product flow, it belongs inside that module.

## Data organization

Do not keep all product seed data in one giant file forever.

Recommended split:

```text
src/data/
  designTokens.ts
  homeSeed.ts
  tenantSeed.ts
  sendItemSeed.ts
```

## API client organization

When backend starts, organize frontend API access by domain:

```text
src/lib/api/
  auth.ts
  users.ts
  listings.ts
  routes.ts
  shipmentRequests.ts
  matches.ts
  conversations.ts
```

## State management rules

### Use local component state for:

- toggles
- active filters
- modal visibility
- temporary UI interactions

### Use TanStack Query for:

- listings
- traveler routes
- shipment requests
- user profile
- verification state
- match results

### Avoid global state unless:

- the state is cross-route
- it is not server state
- it is clearly app-wide

Examples:

- auth session
- selected city
- onboarding completion state

## Styling rules

### Keep global styles for:

- tokens
- layout primitives
- utility selectors
- typography

### Keep component-specific styles near the module if:

- a section has complex custom layout
- a feature is visually unique
- it is not reused elsewhere

Recommended future direction:

- split `index.css` into `styles/tokens.css`, `styles/layout.css`, and `styles/modules/*.css`

## Immediate refactor targets

These should be extracted first:

1. Homepage hero and testimonial sections
2. Tenant listing card and tenant detail panel
3. Send-item form and route card
4. Footer and shell styles already started on this path

## Recommendation summary

The frontend should continue with the current stack, but the codebase should evolve into:

- domain modules
- shared UI primitives
- split seed data
- clear API clients
- thinner page files

That will make it much easier for backend integration later because the frontend will already be speaking in domain boundaries.
