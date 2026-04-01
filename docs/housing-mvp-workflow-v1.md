# Housing MVP Workflow v1

This document captures the current product direction for Trusted Network after the housing-first reset on April 2, 2026.

## Objective

Build a clear tenant replacement marketplace where:

- seekers can find rooms quickly
- hosts can publish and manage replacement listings
- the UI respects user intent instead of mixing both sides of the marketplace together

## Core concept

Trusted Network now behaves as one housing app with two explicit intents:

- `FIND_ROOM`
- `FIND_REPLACEMENT`

## Intent model

### Find room

Purpose:

- browse live published room listings
- compare rooms using photos, rent, location, move-in date, and amenities
- open a details page for the full apartment review flow

Rules:

- do not show host dashboard controls
- do not mix in seeker-posted requirements

### Find replacement

Purpose:

- create a replacement listing
- save drafts
- publish listings
- mark listings as rented
- remove listings from the active dashboard

Rules:

- show only the current user's listings
- keep the publishing flow structured and step-based

## Current housing navigation

- `Home`
- `Housing`
- `Profile`

Delivery has been removed from the active navigation for this MVP phase.

## Current host listing flow

The listing composer now follows these steps:

1. Basic info
2. Pricing
3. Amenities
4. Room details
5. Images
6. Description
7. Review

## Listing status mapping

The schema keys were preserved. The current product language maps to existing schema values like this:

- `draft` -> `DRAFT`
- `published` -> `PUBLISHED`
- `rented` -> `FILLED`
- removed from dashboard -> `ARCHIVED`

## Important product rules

- no mixed host and seeker feeds
- no delivery in the active MVP surface
- no removal of existing schema keys
- structured fields stay outside free-text description wherever possible

## Current implementation notes

- find room uses published tenant replacement listings only
- find replacement uses the listings API filtered by the signed-in user's id for drafts and active listings
- desktop listing details open on a dedicated route with a full apartment image carousel
- profile and verification remain available separately from housing mode selection

## Next likely housing improvements

- richer listing filters
- save listing flow
- better edit affordances for hosts
- mobile-specific detail behavior
- later return of "people looking" only after the core listing marketplace is stable
