# Sprint planning — Cirvo MVP

This document tracks **near-term delivery** aligned with [PRODUCT_OVERVIEW.md](PRODUCT_OVERVIEW.md) and [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md). Update it as sprints complete.

---

## Current focus: Unified in-app notifications (web + mobile + backend)

**Goal:** Users signed in on **web** or **mobile** see the **same** notification inbox (history, unread state, deep links). Push delivery (FCM / Web Push) is **out of scope for the first slice** unless explicitly pulled in; the **server-side inbox is the source of truth**.

### Product principles (from discovery)

- **Single source of truth:** Notifications are **persisted in the backend**, not only on device or via push.
- **Cross-platform:** Same API for web and mobile; **read state syncs** across devices for the same account.
- **Push is additive:** Firebase Cloud Messaging (or similar) **delivers** alerts later; it does **not** replace stored notifications.
- **Lightweight API responses**; detail screens load full inquiry/listing as today.

### Backend (required)

| Item | Notes |
|------|--------|
| Data model | e.g. `UserNotification` (or equivalent): `userId`, `type`, `payload` (JSON), `readAt`, `createdAt`; indexes on `(userId, createdAt DESC)` and unread queries |
| Create events | Emit rows on domain events (e.g. **new listing inquiry**, inquiry status changes); single internal helper to avoid duplication |
| API | Authenticated `GET` list + unread count, **cursor pagination**; `PATCH` mark one / mark all read |
| Idempotency | Optional `dedupeKey` per business event if workers retry |

### Web (required)

| Item | Notes |
|------|--------|
| Shell / header | Bell icon + unread badge (when logged in) |
| Screen | Notification list, tap → deep link (listing / inquiry detail) |
| State | Fetch on load + on focus; optimistically mark read then confirm with API |

### Mobile (required)

| Item | Notes |
|------|--------|
| Navigation | Bell entry point consistent with app shell |
| Screen | Same behaviors as web (list, unread, deep link) |
| Polling | Acceptable MVP: refresh on focus + pull-to-refresh; realtime later |

### Explicitly later (not blocking this sprint)

- FCM / APNs push pipelines
- Web Push for browser
- Email as parallel subscriber (can follow same domain events)

### Acceptance criteria (MVP)

1. New inquiry creates a **visible** notification for the **listing owner** in DB.
2. Owner sees it in **web** and **mobile** inbox when logged in (same user).
3. Marking read on **one** client reflects **unread count** on the **other** after refresh.
4. Tapping a notification navigates to the correct **listing or inquiry** context.
5. APIs are **paginated** and do not return unbounded lists.

### References

- Product: [PRODUCT_OVERVIEW.md](PRODUCT_OVERVIEW.md) — §8.3 Notifications & cross-platform inbox  
- System: [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) — User notifications  

---

## Completed / parked (historical)

_Use this subsection to log done work or deferred themes without losing context._

- (none recorded yet)
