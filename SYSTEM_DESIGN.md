# System Design: Tenant Replacement Platform

## Scale Targets
- Listings: 10,000 → 100,000
- Concurrent users: moderate (mobile-heavy traffic)
- Read-heavy system (~80% reads, 20% writes)

---

## Core Entities

### Listings
- id
- title
- rent
- location (lat, lng, area)
- preferences (gender, occupancy)
- created_at

### Enquiries
- id
- listing_id
- user_contact
- message
- created_at

---

## Key System Characteristics

### 1. Read-Heavy Workload
- Listing feed is most accessed
- Filtering + ranking is critical path

### 2. Matching Layer (Core Differentiator)
- Ranking based on:
  - budget similarity
  - distance
  - preferences
- Should be:
  - fast
  - tunable
  - explainable

---

## Listing Feed Strategy

### Query Pattern
- Filter:
  - budget range
  - location
  - preferences
- Sort:
  - relevance score (matching)
  - recency fallback

---

## Performance Strategy

### 1. Indexing
- rent (range queries)
- location (geo queries or indexed fields)
- created_at (sorting)
- composite indexes for filters

### 2. Pagination
- Cursor-based preferred over offset for scale

### 3. Caching (Phase 2)
- Cache frequent filter combinations
- Cache top listings per area

---

## Matching Strategy (v1)

### Score Components
- Budget match → 40%
- Location proximity → 40%
- Preferences → 20%

### Design Rules
- Keep scoring logic outside DB query initially
- Avoid expensive joins for scoring
- Compute score after fetching filtered subset

---

## Anti-Patterns to Avoid
- Full table scans
- Sorting large datasets without indexes
- Over-fetching data
- Heavy logic in frontend
- Tight coupling between matching and DB layer

---

## Future Enhancements
- Personalized ranking
- Behavior-based recommendations
- Redis caching layer
- Precomputed ranking