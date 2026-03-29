# Work Email OTP Delivery

## What Changed

The work-email verification flow now sends OTP emails through Resend.

The OTP verification logic itself is unchanged:

- generate a 6-digit OTP
- hash OTP before storing it
- expire after 5 minutes
- allow limited retries
- verify and then mark the user as organization-email verified

Only the delivery layer changed.

## Current Delivery Flow

1. User requests OTP for a professional email.
2. Backend validates rate limits and allowed domains.
3. Backend creates the OTP record in `WorkEmailOtp`.
4. Backend sends the OTP email through Resend.
5. If email sending fails, the newly-created OTP record is deleted.
6. User submits OTP to complete verification.

## Environment Variables

Backend now expects:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Example:

```env
RESEND_API_KEY="re_xxxxxxxxx"
RESEND_FROM_EMAIL="Trusted Network <onboarding@resend.dev>"
```

## Local Development Behavior

- If `RESEND_API_KEY` is missing in development, backend falls back to preview mode.
- In preview mode, the API still returns `otpPreview` for local testing.
- In production, missing `RESEND_API_KEY` causes email sending to fail fast.

## Why Resend

Resend is a good fit for this stage because:

- quick SDK integration
- clean developer experience
- generous free tier for MVP testing
- works well for transactional emails like OTP delivery

## Alternatives

### Postmark

Best when you want a strong transactional-email focus and excellent deliverability tooling.

### AWS SES

Best when you want lowest-cost scale and are comfortable with more setup and AWS operational overhead.

### Recommendation

For MVP:

- Resend is a strong default

For later scale:

- consider Postmark if deliverability visibility becomes a priority
- consider SES if cost at scale becomes the main concern
