# MVP Decision Log

This log captures the current implementation choices used to close parallel system tickets without reopening scope on every pass.

## Product Decisions

- `Dashboard route`: `/projects` is the canonical dashboard. Do not introduce a separate `/dashboard` route for the MVP.
- `Preview model`: the MVP uses the current stitched vertical player in `src/features/preview/components/project-preview-page.tsx`, not a true pinned scroll engine.
- `Settings scope`: `/settings` remains a deferred informational page for MVP content, but it is included in primary navigation as a discoverable route.
- `Google auth`: optional, not required for launch. Credentials auth is the default path unless both Google provider secrets are configured.
- `Export`: keep visible only as an explicit unavailable or coming-soon state. Do not imply working export flows.
- `Dashboard mock fallbacks`: remove mock dashboard behavior in core user flows rather than replacing it with an implicit demo mode.

## Operational Decisions

- `Maintenance execution`: internal maintenance endpoints are manually triggered for the MVP and require `x-internal-maintenance-token`.
- `Rate limiting`: the in-memory limiter is acceptable only for local development and single-instance MVP deployment.
- `Guest lifecycle`: unclaimed guest sessions, guest projects, and guest-scoped assets follow the guest expiration window and should be cleaned up together.

## UX Guidance

- Prefer copy that describes uploads, scene editing, stitched preview, guest claiming, and authenticated ownership.
- Avoid copy that promises production export, advanced keyframing, true scroll-engine playback, or hidden routes not present in `src/app/**/page.tsx`.
