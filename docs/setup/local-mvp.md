# Local MVP Setup

This project runs the MVP locally with Next.js, PostgreSQL, Prisma, and filesystem-backed asset storage.

## Minimum Required Environment Values

Copy `.env.example` to `.env` and set at least these values:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma
- `NEXTAUTH_SECRET`: secret for session signing
- `NEXTAUTH_URL`: local app URL, usually `http://localhost:3000`
- `INTERNAL_UPLOAD_TOKEN_SECRET`: upload contract signing secret
- `LOCAL_STORAGE_ROOT`: local directory for uploaded originals and generated assets

Optional for MVP:

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: leave blank unless Google auth is enabled
- `QWEN_API_URL` and `QWEN_API_KEY`: leave blank when using `QWEN_MOCK_MODE=true`
- `INTERNAL_MAINTENANCE_TOKEN`: required only to call internal maintenance endpoints manually

## Environment Reference

These are the runtime values currently parsed in `src/config/env.ts`.

### Core App

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: NextAuth session secret; must be set in production
- `NEXTAUTH_URL`: public app URL used by auth flows
- `LOCAL_STORAGE_ROOT`: local filesystem root for uploaded and generated assets
- `LOG_LEVEL`: Pino log level
- `NODE_ENV`: `development`, `test`, or `production`

### Auth And Guest Access

- `GOOGLE_CLIENT_ID`: optional Google auth provider id
- `GOOGLE_CLIENT_SECRET`: optional Google auth provider secret
- `GUEST_SESSION_COOKIE_NAME`: cookie key used for guest sessions
- `GUEST_SESSION_TTL_HOURS`: guest session lifetime before cleanup and claim expiration rules apply
- `GUEST_MAX_PROJECTS`: max unclaimed guest projects per guest session
- `GUEST_MAX_SCENES_PER_PROJECT`: max scenes allowed per project in the MVP

Google auth is optional. If you enable it, set both Google env vars together; a partial configuration now fails fast.

### Uploads And Internal Operations

- `UPLOAD_MAX_FILES`: max upload batch size
- `UPLOAD_MAX_FILE_SIZE_BYTES`: max size per uploaded file
- `UPLOAD_ALLOWED_MIME_TYPES`: comma-separated allowlist for upload MIME types
- `INTERNAL_UPLOAD_TOKEN_SECRET`: HMAC secret used to sign upload contracts
- `INTERNAL_MAINTENANCE_TOKEN`: bearer-style header token for manual maintenance endpoints

### Processing And Qwen

- `QWEN_API_URL`: real provider base URL
- `QWEN_API_KEY`: real provider API key
- `QWEN_MODEL`: provider model id
- `QWEN_TIMEOUT_MS`: request timeout for provider calls
- `QWEN_MAX_RETRIES`: retry count for provider requests
- `QWEN_MOCK_MODE`: when `true`, local mock decomposition stays enabled and provider credentials may stay blank
- `PROCESSING_JOB_TIMEOUT_MS`: max queued/processing job age before recovery marks it failed
- `PROCESSING_CANARY_PERCENT`: rollout percentage for processing behavior

### Feature Flags

- `FEATURE_MOTION_PIPELINE`: toggle motion pipeline behavior
- `FEATURE_PLAYBACK_PIPELINE`: toggle playback plan generation behavior
- `FEATURE_PREVIEW_FALLBACKS`: allow preview fallbacks when scenes are only partially ready
- `FEATURE_REDUCED_MOTION_PREVIEW`: enable reduced-motion playback plans

### Rate Limiting

- `RATE_LIMIT_WINDOW_MS`: request bucket window size
- `RATE_LIMIT_MAX_REQUESTS`: request count allowed per window

The current limiter is in-memory (`src/infrastructure/rate-limit/memory-rate-limiter.ts`). That is acceptable for single-instance local development and a small single-instance MVP deployment, but it is not suitable for horizontally scaled production because limits are not shared across instances and reset on restart.

## PostgreSQL Bootstrapping

1. Start PostgreSQL locally.
2. Create a database named `parallax_story_composer` or update `DATABASE_URL`.
3. Install dependencies:

```bash
npm install
```

4. Apply Prisma migrations and generate the Prisma client:

```bash
npx prisma migrate deploy
npx prisma generate
```

For a fresh local database during development, `npx prisma migrate dev` is also acceptable.

## Launching The App

Run the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Qwen Modes

### Mock Mode

Use this for local MVP work:

- Set `QWEN_MOCK_MODE=true`
- Leave `QWEN_API_URL` and `QWEN_API_KEY` blank
- Upload images, finalize scenes, generate outputs, and preview using the local mock path

### Real Provider Mode

Use this only when provider credentials are available:

- Set `QWEN_MOCK_MODE=false`
- Set `QWEN_API_URL`, `QWEN_API_KEY`, and optionally override `QWEN_MODEL`
- Keep the same upload, finalize, and preview flow; only the decomposition provider changes

## Local Asset Storage

- Uploaded originals are written under `LOCAL_STORAGE_ROOT/projects/<projectId>/incoming/*`
- Generated thumbnails, composites, layers, and manifests are written under `LOCAL_STORAGE_ROOT/projects/<projectId>/scenes/<sceneId>/v<generationVersion>/*`
- Assets are served back through `GET /api/v1/assets/<storage-path>`

This makes the mock Qwen path usable end-to-end locally: upload images, finalize scenes, generate decomposition outputs, and preview stitched playback with real renderable asset URLs.

## Health And Readiness Checks

- Liveness: `GET /api/v1/health/live`
- Readiness: `GET /api/v1/health/ready`

The readiness endpoint returns `503` when env parsing fails or PostgreSQL is unavailable.

## Manual Maintenance Endpoints

These endpoints now require the `x-internal-maintenance-token` header to match `INTERNAL_MAINTENANCE_TOKEN`:

- `POST /api/v1/internal/maintenance/cleanup`
- `POST /api/v1/internal/maintenance/recover-timeouts`

Example:

```bash
curl -X POST http://localhost:3000/api/v1/internal/maintenance/cleanup \
  -H "x-internal-maintenance-token: $INTERNAL_MAINTENANCE_TOKEN"
```

For the MVP, these endpoints are treated as manual operations rather than a scheduled background job. Trigger them explicitly from a trusted internal environment until scheduled infrastructure exists.

## Guest And Asset Lifecycle

- Guest sessions expire after `GUEST_SESSION_TTL_HOURS`
- Unclaimed guest projects inherit the guest session expiry and are deleted by maintenance cleanup after expiration
- Uploaded originals, thumbnails, generated layers, composites, manifests, and playback plans should be treated as guest-scoped assets when attached to an expiring guest project
- Claiming a guest project clears project expiration and moves ownership to the authenticated user
- Timed-out processing jobs are recovered by `recover-timeouts`, which marks them failed so the editor and preview can represent the real state

## Recommended Validation

```bash
npm run lint
npm test
npm run build
```

Narrow validation commands that are useful while iterating:

```bash
curl http://localhost:3000/api/v1/health/live
curl http://localhost:3000/api/v1/health/ready
npx vitest run tests/unit/modules/uploads/service.test.ts
npx vitest run tests/unit/modules/projects/service.test.ts
```
