# Google Maps and web client config

This note covers **Places autocomplete**, **Static Map previews** (listing location), and **`GET /api/public-config`** (Cloudinary delivery + static-map toggle). It complements [DEPLOYMENT.md](../DEPLOYMENT.md), [listing-image-upload-architecture.md](./listing-image-upload-architecture.md), and the vendor overview [platforms-and-services.md](./platforms-and-services.md).

## Google Maps API key (browser)

The web app uses a **single** variable for both:

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_GOOGLE_MAPS_API_KEY` | Frontend build (Netlify, local `.env`) | **Places API (New)** — autocomplete and place details (`frontend/src/lib/googleMaps.ts`). **Maps Static API** — preview image URL (`buildGoogleStaticMapUrl`). |

In [Google Cloud Console](https://console.cloud.google.com/) for the project that owns the key:

1. **Enable** at least **Places API** (or Places API New as used by your endpoints) and **Maps Static API**.
2. **Credentials** → your browser key → **Application restrictions**: HTTP referrers — add production origins (e.g. `https://your-domain.com/*`, `https://www.your-domain.com/*`) and local dev if needed (`http://localhost:5173/*`).
3. **API restrictions**: restrict the key to only the APIs you use (Places + Static Maps), or use a separate key per surface if you want tighter isolation.
4. **Billing** must be enabled on the project for Maps Platform; usage is billed per request (monthly credits may apply — see Google’s current pricing).

If autocomplete works but the static map returns **403**, the usual causes are **Static Maps not enabled**, **API restrictions** excluding Static Maps, or **referrer** not matching the page origin.

## Turning Static Map previews on or off

The UI shows a map **only** when all of the following hold:

- `VITE_GOOGLE_MAPS_API_KEY` is set (build time).
- The merged **static map preview** flag is on (see below).

### Frontend build (hard off)

| Variable | Effect |
|----------|--------|
| `VITE_GOOGLE_MAPS_STATIC_MAP_ENABLED` | If set to `false`, `0`, `no`, or `off` (case-insensitive), the app **never** requests Static Maps for that build, even if the API says previews are enabled. **Redeploy** the web app after changing. |

Omit the variable or set `true` / `1` / `yes` / `on` to allow previews (subject to the server flag).

### Backend (kill switch without web redeploy)

| Variable | Effect |
|----------|--------|
| `STATIC_MAP_PREVIEW_ENABLED` | Exposed as `staticMapPreviewEnabled` on **`GET /api/public-config`**. `false`, `0`, `no`, or `off` disables previews for clients that load public config. Unset defaults to **enabled**. **Redeploy the API** after changing. |

Precedence:

1. If `VITE_GOOGLE_MAPS_STATIC_MAP_ENABLED` is explicitly off → previews **off**.
2. Else if `staticMapPreviewEnabled` from public config is **false** → previews **off**.
3. Else if the Maps key is set → previews **on**.

Disabling previews stops **Static Map** image requests only; **Places** autocomplete still uses `VITE_GOOGLE_MAPS_API_KEY` unless you change that code path separately.

## Public config API (`GET /api/public-config`)

Unauthenticated JSON used by the web app on load (deduped fetch):

| Field | Source | Purpose |
|-------|--------|---------|
| `cloudinaryCloudName` | `CLOUDINARY_CLOUD_NAME` on the API | Lets the client build `https://res.cloudinary.com/...` URLs when `VITE_CLOUDINARY_CLOUD_NAME` was not set at build time. |
| `staticMapPreviewEnabled` | `STATIC_MAP_PREVIEW_ENABLED` on the API | Billing / ops toggle for Static Map images (see above). |

Smoke test:

```bash
curl -sS "https://api.your-domain.com/api/public-config"
```

Expect something like: `{"cloudinaryCloudName":"…","staticMapPreviewEnabled":true}`.

## Listing images (Cloudinary) — quick cross-reference

- **Uploads**: backend signing uses `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and optional `CLOUDINARY_LISTINGS_FOLDER_ROOT` (see [DEPLOYMENT.md](../DEPLOYMENT.md)).
- **Display URLs**: ideally set **`VITE_CLOUDINARY_CLOUD_NAME`** on the frontend build to match the backend cloud name; otherwise the client relies on **`cloudinaryCloudName`** from public config after one request.

Full image pipeline: [listing-image-upload-architecture.md](./listing-image-upload-architecture.md).
