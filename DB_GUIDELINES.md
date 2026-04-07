# Database Guidelines

## Query Rules
- Always use indexed columns in WHERE clauses
- Avoid SELECT *
- Limit results aggressively

## Indexing Strategy
- Single indexes:
  - rent
  - created_at

- Composite indexes:
  - (location, rent)
  - (preferences, rent)

## Pagination
- Prefer cursor-based:
  - WHERE id < last_seen_id
  - ORDER BY created_at DESC

## Scaling Notes
- At 10k–100k rows:
  - PostgreSQL handles well IF indexed properly
- Avoid joins on large tables in hot paths

## Matching
- Do NOT compute heavy scoring inside SQL initially
- Fetch filtered data → score in application layer