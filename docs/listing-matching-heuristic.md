# Listing Matching Heuristic

This document explains the current room-listing matching model used for the `find room` flow, why it exists, how the end-to-end request path works, and how to tune it safely.

## Objective

The matching model exists to make the public room feed feel useful immediately, without needing a heavy recommendation system.

The goal is:

- show better room listings first when a signed-in user has an active room need
- keep the feed useful for signed-out users too
- make the ranking explainable
- keep the model cheap enough to run inside the existing listings API

## Why a heuristic model first

We chose a heuristic model instead of ML for the current MVP because:

- the product does not yet have enough interaction history for a learned model
- the inputs are already highly structured
- we need explainable ranking, not a black-box score
- product teams can tune weights quickly without building training infrastructure

This gives us a strong v1 while keeping the door open for a more advanced system later.

## High-level behavior

The public listings feed now has two ranking modes.

### 1. Personalized ranking

Used when all of the following are true:

- the frontend sends a bearer token with `GET /listings`
- the token resolves to a valid app session
- the user has an active housing need in `OPEN` or `MATCHED` state

In this case:

- the backend finds the user’s latest active housing need
- each published room listing is scored against that need
- weak matches are filtered out
- the remaining listings are sorted by `finalScore`
- each listing includes a `matchSummary` payload with score details and top reasons

### 2. Generic ranking

Used when:

- the user is signed out
- the token is missing
- the token is invalid/stale
- or the user has no active housing need

In this case:

- the feed is still returned normally
- no personalized fit calculation is applied
- listings are ranked by listing quality, freshness, verification, and boost signals
- no backend filtering is done by match score

This ensures the feed is always usable, even without login.

## End-to-end request flow

### Frontend

The `find room` page calls:

```ts
GET /listings?status=PUBLISHED
```

If a session token exists, the frontend includes it in the `Authorization` header even though the route is still public.

### Controller

`ListingsController.findAll()`:

- reads the optional `Authorization` header
- tries to resolve a session using `AuthService.getAuthenticatedSession()`
- ignores invalid or missing tokens instead of failing the request
- passes the optional session into `ListingsService.findAll()`

This allows one public API to serve both signed-out and personalized signed-in feed ranking.

### Service

`ListingsService.findAll()` does the following:

1. Fetch candidate listings from the database.
2. If `ownerUserId` is present, return the owner-scoped results directly.
   This is used for “my listings” style views and bypasses public-feed scoring.
3. If no owner filter is present:
   - try to load the viewer’s latest active housing need
   - if no active need exists, apply generic ranking
   - if an active need exists, apply personalized matching

### Personalized scoring path

For each listing:

1. Compute a `matchScore` from seeker/listing compatibility.
2. Compute a separate `qualityScore` from listing completeness and trust signals.
3. Blend them into `finalScore`.
4. Save the top explanatory reasons.
5. Drop listings whose `matchScore` is below the minimum threshold.
6. Sort the rest by `finalScore`, then by recency.

### Response shape

The listings API still returns the same listing objects, but for personalized results it now adds:

```json
{
  "matchSummary": {
    "matchScore": 64,
    "qualityScore": 21,
    "finalScore": 56,
    "label": "GOOD_MATCH",
    "reasons": [
      "Locality match: Koramangala",
      "Within rent budget",
      "Move-in lines up well"
    ]
  }
}
```

If generic ranking is used, `matchSummary` is omitted.

## Personalized scoring model

The model intentionally separates compatibility from listing quality.

### Compatibility score: `matchScore`

This score answers:

“Does this room fit what the seeker said they want?”

Current weighted signals:

- city exact match: `+22`
- locality exact match: `+16`
- property type exact match: `+10`
- occupancy type exact match: `+10`
- rent fit: up to `+12`
- deposit fit: up to `+6`
- maintenance fit: up to `+4`
- move-in alignment: up to `+10`
- amenity overlap: up to `+8`
- nearby workplace overlap: up to `+8`

### Budget alignment

Budget scoring is intentionally tolerant, not binary.

If the listing amount is:

- within budget: full score
- up to 10% above budget: 50% of that signal’s score
- up to 20% above budget: 25% of that signal’s score
- above that: 0

This avoids throwing away listings that are slightly above the ideal range.

### Move-in alignment

Move-in scoring uses date proximity:

- within 7 days: full score
- within 14 days: 80%
- within 30 days: 50%
- within 45 days: 20%
- beyond 45 days: 0

This reflects the reality that move-in dates are often flexible, but not infinitely flexible.

### Preference overlap

Amenities and nearby workplaces use proportional overlap:

```text
(matched_preferences / total_preferences) * max_signal_score
```

This prevents a listing from being over-rewarded just because the user entered many preferences.

## Listing quality model

The quality model answers:

“How complete and trustworthy is this listing?”

Current signals:

- 3+ images: `+8`, otherwise 1+ image: `+5`
- rich description: `+6`, short description: `+3`
- 4+ amenities: `+4`, otherwise 1+ amenity: `+2`
- 2+ nearby places: `+3`, otherwise 1+ nearby place: `+1`
- locality present: `+2`
- verified owner: `+4`
- boosted listing: `+1`
- recent listing: `+2`

This prevents low-information listings from dominating even if they match one or two seeker preferences.

## Final score formula

The final personalized ranking score is:

```text
finalScore = round(matchScore * 0.82 + qualityScore * 0.18)
```

Why this split:

- compatibility should dominate the order
- quality should break ties and improve feed trust
- quality should not overpower a bad functional match

## Match threshold

Listings are filtered out if:

```text
matchScore < 30
```

Why:

- this removes obviously weak personalized results
- it keeps the personalized feed from pretending every listing is relevant
- it still allows “possible” listings when enough partial signals line up

This threshold should be tuned cautiously because it directly affects feed density.

## Match labels

The backend converts `finalScore` into a display label:

- `BEST_MATCH` for `finalScore >= 78`
- `GOOD_MATCH` for `finalScore >= 58`
- `POSSIBLE` otherwise

These labels are only used for personalized results.

## Reason generation

For personalized results, the backend also stores the top three strongest reasons.

Examples:

- `City match: Bengaluru`
- `Locality match: HSR Layout`
- `Within rent budget`
- `Occupancy: Shared`
- `2 amenity matches`
- `Near 1 preferred workplace`

These reasons serve two purposes:

- explain the order of the feed
- build user trust in the ranking system

## Logged-out user behavior

When the viewer is not logged in:

- the API still returns the live room feed
- no active housing need is loaded
- no personalized `matchSummary` is attached
- the ranking falls back to generic listing quality scoring

This is important because signed-out users still need a useful browse experience, but we should not fabricate personalized fit without user preferences.

## Generic ranking model

Generic ranking uses:

- listing quality score
- boost status
- recency

This is a discovery ranking, not a seeker-fit ranking.

Its job is to:

- reward complete listings
- reward trust signals
- keep the feed fresh
- preserve a strong first impression for new or signed-out users

## Why this belongs in the backend

Moving the model into the backend gives us several advantages:

- one source of truth for ranking
- consistent results across web and future clients
- easier tuning without duplicating frontend logic
- less client-side work and fewer chances for drift
- better control over optional personalization by session

It also makes future experimentation easier because ranking can evolve without changing page-level frontend code every time.

## Current limitations

This is still a heuristic model, so it has known limits:

- it does not learn from clicks, inquiries, or conversions yet
- it assumes structured preferences are accurate
- it uses exact locality matching rather than geospatial distance
- it does not yet include inferred behavioral preferences
- it scores one active housing need, not multiple competing seeker intents

These are acceptable tradeoffs for the current MVP.

## Tuning guidance

When tuning this model, change one category at a time.

Safe tuning order:

1. threshold
2. compatibility weights
3. quality weights
4. label cutoffs

Good tuning questions:

- Are we showing too few personalized results?
- Are poor but nearby listings ranking too high?
- Are verified but weak-fit listings outranking stronger matches?
- Are seekers seeing enough variety after applying thresholding?

## Recommended next steps

- persist score snapshots for debugging or analytics
- log which reasons appear most often in top-ranked results
- add locality-distance scoring when lat/lng quality improves
- later incorporate engagement signals like view-to-inquiry conversion
- eventually move from pure heuristics to a hybrid heuristic + behavioral model

## Implementation files

Primary backend implementation:

- [listings.controller.ts](/Users/harsh/Documents/mvp/backend/src/modules/listings/listings.controller.ts)
- [listings.service.ts](/Users/harsh/Documents/mvp/backend/src/modules/listings/listings.service.ts)

Primary frontend consumption:

- [FindTenantPage.tsx](/Users/harsh/Documents/mvp/frontend/src/pages/FindTenantPage.tsx)
