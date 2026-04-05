# Supabase Google Auth with Netlify and EC2

This guide explains how Google login works in the current Trusted Network stack when:

- frontend is deployed on Netlify
- backend API is deployed on EC2 behind Nginx
- auth is handled by Supabase Auth
- Google OAuth credentials are configured in Google Cloud and stored in Supabase

It also documents the redirect chain, required dashboard settings, environment variables, and the most common production mistakes.

## Current code flow

The frontend starts Google login from the app auth context:

- [frontend/src/context/AppAuthContext.tsx](../frontend/src/context/AppAuthContext.tsx)

It sends the user to Supabase OAuth with:

- provider: `google`
- redirect target: ``${window.location.origin}/auth``

That means:

- local frontend sends users back to `http://localhost:3000/auth`
- Netlify frontend sends users back to `https://your-site.netlify.app/auth`

After Supabase sends the user back to the frontend, the frontend reads the Supabase session and exchanges the Supabase access token with the backend:

- `POST /api/auth/supabase/google-login`

That backend flow is implemented in:

- [backend/src/modules/auth/auth.service.ts](../backend/src/modules/auth/auth.service.ts)

The frontend API base URL is resolved in:

- [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

Netlify SPA route fallback is handled by:

- [frontend/public/_redirects](../frontend/public/_redirects)

## End-to-end redirect flow

This is the full redirect chain for a successful production login.

### 1. User clicks Continue with Google

The frontend calls:

```ts
supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth`,
  },
})
```

If the current site is:

```text
https://your-site.netlify.app
```

then the redirect target becomes:

```text
https://your-site.netlify.app/auth
```

### 2. Supabase sends the user to Google

Supabase uses the Google client ID and client secret that you configured in:

- Supabase Dashboard
- `Authentication -> Providers -> Google`

Google does not redirect directly back to Netlify.

Google redirects back to Supabase at:

```text
https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
```

This exact callback must exist in the Google OAuth client configuration.

### 3. Supabase redirects the browser back to your frontend

After Google signs the user in, Supabase redirects the browser to the frontend URL allowed in Supabase Auth settings.

In production that should be:

```text
https://your-site.netlify.app/auth
```

If Supabase is still configured to use localhost, you will see the browser return to something like:

```text
http://localhost:3000/#access_token=...
```

That is a setup issue in Supabase redirect settings, not a frontend OAuth bug.

### 4. Frontend receives the Supabase session

The app loads on `/auth`, and Supabase JS restores the session from the URL hash.

Then the frontend reads the Supabase access token and calls the backend:

```text
POST https://your-api-domain/api/auth/supabase/google-login
```

### 5. Backend creates the app session

The backend verifies the Supabase access token by calling:

```text
https://<your-supabase-project-ref>.supabase.co/auth/v1/user
```

Then it creates or updates the app user and returns the app session token used by Trusted Network.

## What each platform is responsible for

### Google Cloud

Google Cloud is only responsible for trusting Supabase as the OAuth client.

It should know:

- the client ID
- the client secret
- the authorized redirect URI pointing back to Supabase

It should not send users directly to Netlify in this Supabase social-login setup.

### Supabase Auth

Supabase is the OAuth broker between Google and your app.

It is responsible for:

- starting Google OAuth
- receiving the callback from Google
- creating the Supabase session
- redirecting the browser back to your frontend

### Netlify

Netlify hosts the React app and must:

- build with the correct production env vars
- serve `/auth` through the SPA router
- point all frontend API calls at the live backend, not localhost

### EC2 + Nginx backend

The backend must:

- expose the NestJS API publicly over HTTPS
- allow frontend requests through CORS
- accept the Supabase access token and create the Trusted Network session

## Required dashboard settings

## 1. Google Cloud Console

Create or use one OAuth 2.0 client for Supabase Google sign-in.

Required setting:

- `Authorized redirect URI`

Use:

```text
https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
```

Example:

```text
https://dqnbfaaypnwktnxmtgro.supabase.co/auth/v1/callback
```

Important:

- do not use your Netlify `/auth` URL as Google's redirect URI in this flow
- Google should redirect to Supabase, not directly to your frontend

## 2. Supabase Dashboard

### Authentication -> Providers -> Google

Set:

- Google client ID
- Google client secret

These should match the Google OAuth client above.

### Authentication -> URL Configuration

Set `Site URL` to your frontend root:

```text
https://your-site.netlify.app
```

Add `Redirect URLs` for every environment you actually use.

Recommended:

```text
http://localhost:3000/auth
http://localhost:3000/**
https://your-site.netlify.app/auth
https://your-site.netlify.app/**
```

If you use a custom production domain, add that too:

```text
https://app.yourdomain.com/auth
https://app.yourdomain.com/**
```

Important:

- if `Site URL` is still localhost, Supabase may redirect production users to localhost
- if production `/auth` is missing from Redirect URLs, Supabase may reject the redirect or fall back unexpectedly

## 3. Netlify

Set frontend environment variables in Netlify for the deployed site.

Required:

```env
VITE_API_BASE_URL=https://your-api-domain/api
VITE_SUPABASE_URL=https://<your-supabase-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Important:

- after changing Netlify environment variables, trigger a fresh deploy
- Vite reads these values at build time, not at runtime

### SPA redirect support

Because this app uses React Router, Netlify must serve `index.html` for frontend routes such as `/auth`, `/profile`, and `/find-tenant`.

This repo includes:

- [frontend/public/_redirects](../frontend/public/_redirects)

with:

```text
/* /index.html 200
```

Without this, direct loads or redirects to `/auth` can fail.

## 4. EC2 + Nginx backend

Your backend public URL should look like:

```text
https://api.yourdomain.com
```

The frontend should call:

```text
https://api.yourdomain.com/api
```

Backend env vars should include at least:

```env
DATABASE_URL=
PORT=4000
SUPABASE_URL=https://<your-supabase-project-ref>.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

The backend currently enables CORS globally in:

- [backend/src/main.ts](../backend/src/main.ts)

So cross-origin requests from Netlify are allowed unless Nginx is blocking them.

## Environment variable checklist

## Frontend local

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SUPABASE_URL=https://<your-supabase-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Frontend production on Netlify

```env
VITE_API_BASE_URL=https://your-api-domain/api
VITE_SUPABASE_URL=https://<your-supabase-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Backend on EC2

```env
DATABASE_URL=
PORT=4000
SUPABASE_URL=https://<your-supabase-project-ref>.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Production rollout checklist

1. Deploy the backend and confirm `https://your-api-domain/api/health` works.
2. Set backend env vars on EC2.
3. Configure the Google OAuth client in Google Cloud with the Supabase callback URI.
4. Save the Google client ID and secret in Supabase Google provider settings.
5. Set the Supabase `Site URL` to the Netlify production domain.
6. Add Netlify `/auth` and wildcard redirect URLs in Supabase.
7. Set Netlify frontend env vars and redeploy.
8. Confirm direct navigation to `https://your-site.netlify.app/auth` loads the app shell, not a 404.
9. Test login from the deployed frontend.
10. Confirm the frontend successfully calls `/api/auth/supabase/google-login`.

## Common failure modes

### Problem: browser returns to `http://localhost:3000/#access_token=...`

Cause:

- Supabase `Site URL` is still localhost
- production redirect URL is missing in Supabase
- login was started from a local build instead of Netlify

Fix:

- set Supabase `Site URL` to the Netlify domain
- add `https://your-site.netlify.app/auth`
- redeploy frontend and retry

### Problem: Google login works, but the app shows network errors after redirect

Cause:

- `VITE_API_BASE_URL` in Netlify still points to localhost or is missing
- backend domain is unreachable

Fix:

- set `VITE_API_BASE_URL=https://your-api-domain/api`
- redeploy Netlify
- verify backend `/api/health`

### Problem: redirect lands on `/auth` but Netlify shows 404

Cause:

- SPA fallback is missing

Fix:

- ensure [frontend/public/_redirects](../frontend/public/_redirects) is deployed

### Problem: backend rejects app session exchange

Cause:

- backend `SUPABASE_URL` or `SUPABASE_ANON_KEY` is wrong
- frontend and backend are pointing at different Supabase projects

Fix:

- confirm both frontend and backend use the same Supabase project ref and anon key

### Problem: Google says redirect URI mismatch

Cause:

- Google OAuth client does not have the Supabase callback URI

Fix:

- add:
  `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`

## Current codebase safeguards

This repo now includes two production safeguards:

1. [frontend/src/lib/api.ts](../frontend/src/lib/api.ts) throws in non-local environments if `VITE_API_BASE_URL` is missing, instead of silently calling localhost.
2. [frontend/public/_redirects](../frontend/public/_redirects) ensures Netlify serves the SPA correctly for frontend routes.

## Recommended sanity test

Use this sequence after every auth-related deploy:

1. Open the Netlify production site.
2. Open browser devtools network tab.
3. Click `Continue with Google`.
4. Finish Google sign-in.
5. Confirm the browser returns to `https://your-site.netlify.app/auth`.
6. Confirm the frontend calls:
   `POST https://your-api-domain/api/auth/supabase/google-login`
7. Confirm the app session is created and the user is shown as signed in.

If step 5 fails, it is almost always a Supabase redirect configuration issue.

If step 6 fails, it is usually a frontend env var or backend reachability issue.
