# Product Overview: Cirvo  
Tenant Replacement & Room Discovery Platform

---

# 1. Problem Statement

Finding rental replacements and rooms is currently fragmented across:
- WhatsApp groups
- Facebook groups
- Brokers
- Unstructured listings

Problems:
- No structured data
- No ranking or relevance
- High friction communication
- Low trust & poor filtering

---

# 2. Solution

Cirvo is a **two-sided marketplace** that connects:

1. **Supply Side (Tenant Replacement)**
   - Users who want someone to replace them in a rented apartment

2. **Demand Side (Find Room)**
   - Users looking for a room based on preferences

The platform improves:
- Discovery (structured listings)
- Relevance (matching algorithm)
- Conversion (simple enquiry flow)

---

# 3. Core Product Philosophy

- Mobile-first, fast interactions
- Low friction (no forced auth early)
- Structured data → better matching
- Conversion > complexity
- Ranking > raw listing order

---

# 4. User Roles

## 4.1 Tenant Replacement User (Lister)
Intent:
> "I want to find someone to take over my room/flat"

Capabilities:
- Create listing
- Manage listing
- Receive enquiries
- Respond externally (phone/email)

---

## 4.2 Find Room User (Seeker)
Intent:
> "I want to find a room that matches my needs"

Capabilities:
- Browse listings
- Apply filters
- Post room requirements
- Send enquiries

---

# 5. Core Domains

## 5.1 Listings (Supply)

Represents:
> A real property available for tenant replacement

### Attributes

#### Basic Info
- id
- title
- description

#### Location
- city
- locality
- latitude (optional)
- longitude (optional)

#### Financials
- rent
- deposit
- maintenance

#### Property Details
- property_type (apartment, PG, etc.)
- bhk_type (1BHK, 2BHK, etc.)
- occupancy (single/shared)
- furnishing (optional)

#### Preferences
- gender preference
- tenant type (optional)

#### Metadata
- created_at
- updated_at
- status (active, draft, archived)

#### Media
- images (Cloudinary URLs)

---

## 5.2 Room Needs (Demand)

Represents:
> A structured requirement posted by a user

### Attributes

#### Location
- preferred_city
- preferred_localities

#### Budget
- preferred_rent
- preferred_deposit
- preferred_maintenance

#### Preferences
- property_type
- occupancy
- move_in_date

#### Metadata
- created_at
- active_flag

---

## 5.3 Enquiries (Interaction Layer)

Represents:
> A user expressing interest in a listing

### Attributes
- id
- listing_id
- sender_user_id (optional if anonymous)
- message
- contact_info (phone/email)
- created_at

---

# 6. Product Flows

---

## 6.1 Tenant Replacement Flow

### Entry Point:
Tenant Replacement Dashboard

### Tabs:

---

### A. Listings

Purpose:
- Show all listings created by user

Features:
- Filter by status:
  - Active
  - Draft
  - Archived
  - Rented

- Metrics:
  - Live listings count
  - Enquiries count (future)
  - Visits (future)

---

### B. Create Listing

Flow:
1. Enter location
2. Enter financials
3. Enter property details
4. Upload images
5. Set preferences

Design Constraints:
- Multi-step form
- Mobile-first
- Auto-save drafts

---

### C. Inquiries

Purpose:
- Show all incoming enquiries

Each item shows:
- Listing reference
- Message preview
- Timestamp

Future:
- Status tracking (responded / pending)

---

## 6.2 Find Room Flow

### Entry Point:
Find Room Dashboard

---

### A. Listings (Discovery Feed)

Purpose:
- Show ranked listings

Features:
- Infinite scroll
- Filter support
- Ranked by matching score

---

### B. Your Room Need

Purpose:
- Capture user intent

Impact:
- Improves ranking relevance

Constraint:
- Should be quick (< 1 min)

---

### C. Your Room Posts

Purpose:
- Show previously created needs

Acts as:
- Demand-side listings

---

### D. Sent Inquiries

Purpose:
- Track user actions

Each item:
- Listing
- Timestamp
- Status (future)

---

# 7. Matching & Ranking System

---

## 7.1 Purpose

Rank listings based on:
> “How well a listing matches a user’s need”

---

## 7.2 Inputs

### Listing Data
- rent
- location
- preferences

### User Data
- room need (if exists)
- filters (if applied)

---

## 7.3 Scoring Model (v1)

### Components

1. Budget Match (40%)
- Difference between listing rent and preferred rent

2. Location Match (40%)
- Exact locality match OR proximity

3. Preference Match (20%)
- Gender
- Occupancy
- Property type

---

## 7.4 Output

- score (0–100)
- Used for sorting feed

---

## 7.5 Execution Strategy

- Apply DB filters first
- Fetch limited dataset
- Apply scoring in application layer

---

# 8. System Behavior

---

## 8.1 Listing Feed

Pipeline:

1. Apply filters (DB level)
2. Fetch paginated results
3. Apply ranking score
4. Sort results
5. Return to client

---

## 8.2 Enquiry Flow

1. User clicks "Enquire"
2. Opens lightweight form
3. Submit enquiry
4. Store in DB
5. Notify owner (email or dashboard)

---

## 8.3 Data Freshness

- Listings sorted by:
  - relevance
  - recency fallback

---

# 9. Performance Considerations

---

## 9.1 Scale Targets
- 10k → 100k listings

---

## 9.2 Critical Path
- Listing feed

---

## 9.3 Optimizations

- Indexed queries
- Cursor-based pagination
- Lightweight payloads
- Avoid heavy joins

---

# 10. UX Principles

---

## Mobile-first:
- One-hand usage
- Fast scroll
- Sticky CTA

---

## Low friction:
- No login required for browsing
- Minimal enquiry form

---

## Fast actions:
- Enquire within 10 seconds

---

# 11. Metrics (Future)

- Enquiry rate
- Listing conversion rate
- Time to first enquiry
- Active listings

---

# 12. Future Roadmap

- Personalized ranking
- Push notifications
- Chat system
- Premium listings
- AI-based recommendations

---

# 13. Key Differentiator

Cirvo is NOT just listings.

It is:
> A **matching-driven discovery system** for rental transitions.