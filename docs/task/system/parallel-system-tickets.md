# Parallel System Tickets

## Purpose

This document groups subsystem tickets that can run in parallel with the core critical path. Some tickets can start immediately, while others should begin after the listed dependency is satisfied.

## Parallel Workstreams

### PAR-01 Setup And Documentation

**Subsystem:** Platform/System

**Goal:** Make MVP setup and operating mode understandable without codebase archaeology.

**Tasks**

- Create a concise MVP setup document using `.env.example`, Prisma, and `npm` scripts
- Document required env values from `src/config/env.ts`
- Document mock-mode versus real-provider mode for Qwen
- Document local startup, health check, and validation commands

**Can Start:** Immediately, but final polish should follow `CORE-01`

### PAR-02 Security Hardening

**Subsystem:** Platform/System, Auth/Access

**Goal:** Reduce obvious MVP operational and access risks while core flows are being built.

**Tasks**

- Protect internal maintenance endpoints in `src/app/api/v1/internal/maintenance/**/route.ts`
- Review whether in-memory rate limiting is acceptable for MVP deployment
- Validate guest cookie and session lifecycle behavior from `src/modules/guest-sessions/service.ts`
- Confirm project authorization behavior across guest and authenticated states in real UI flows
- Ensure secrets and auth config are documented and not silently defaulted in production

**Can Start:** Immediately; some verification improves after `CORE-08`

### PAR-03 UX Honesty Pass

**Subsystem:** Product UX

**Goal:** Remove misleading UI that suggests features exist when they are not part of MVP.

**Tasks**

- Remove or relabel disabled near-features in `src/features/projects/components/project-editor-page.tsx`
- Remove or relabel static settings actions in `src/features/settings/components/settings-page.tsx` if settings are out of scope
- Remove or relabel marketing links in `src/features/marketing/components/landing-page.tsx` that point to nonexistent routes or features
- Replace export messaging with a clear gated or coming-soon state
- Make auth pages reflect actual available auth methods instead of aspirational copy

**Can Start:** Immediately; final pass should follow `CORE-08` and `CORE-09`

### PAR-04 Navigation And Route Cleanup

**Subsystem:** Product UX

**Goal:** Align navigation with the actual MVP route map.

**Tasks**

- Decide whether `/dashboard` exists or whether `/projects` is the canonical dashboard
- Add `/forgot-password` only if password reset is included in MVP; otherwise remove the trigger
- Audit nav and CTA links against real routes in `src/app/**/page.tsx`
- Add placeholder legal, support, and docs routes only if required for launch credibility
- Hide `/settings` from `src/features/shared/components/app-header.tsx` if it is not part of MVP

**Can Start:** Immediately; final route decisions should be consistent with `PAR-05`

### PAR-05 Product Decision Log

**Subsystem:** Product/System

**Goal:** Resolve scope choices that affect implementation and cleanup decisions.

**Tasks**

- Decide whether MVP preview must be a true pinned scroll engine or whether a simpler stitched vertical player is acceptable
- Decide whether settings is in scope or deferred
- Decide whether Google auth is required for launch
- Decide whether export is hidden entirely or shown as gated or coming soon
- Decide whether dashboard mock fallbacks are removed entirely or replaced by explicit demo mode

**Can Start:** Immediately

### PAR-06 Testing Expansion

**Subsystem:** Quality/Ops

**Goal:** Expand coverage beyond the final MVP gate so supporting modules are safer to change.

**Tasks**

- Add unit tests for project service and repository behavior
- Add unit tests for scene service and repository behavior
- Add tests for auth registration and login flows
- Add tests for guest session and claim flow
- Add tests for playback edge cases including partial-ready and failed scenes
- Add tests for upload init, finalize, and storage flow

**Can Start:** After `CORE-04`; some tests depend on `CORE-02`, `CORE-06`, and `CORE-08`

### PAR-07 Maintenance And Data Lifecycle

**Subsystem:** Quality/Ops, Platform/System

**Goal:** Make expiration and background recovery behavior explicit and testable.

**Tasks**

- Verify guest project cleanup behavior from `src/modules/maintenance/service.ts`
- Verify processing timeout recovery behavior from `src/modules/maintenance/service.ts`
- Decide whether maintenance endpoints are manually triggered for MVP or run on a schedule
- Define guest asset expiration behavior consistently across originals, generated assets, and playback plans

**Can Start:** Immediately; implementation details improve after `CORE-02` and `CORE-03`

## Subsystem View

### Platform/System

- `PAR-01` Setup And Documentation
- `PAR-02` Security Hardening
- `PAR-07` Maintenance And Data Lifecycle

### Projects/Scenes

- Cross-check with `CORE-04`, `CORE-05`, and `CORE-09`
- Add support tests through `PAR-06`

### Processing/Pipeline

- Cross-check with `CORE-06`
- Add edge-case validation through `PAR-06` and `PAR-07`

### Preview

- Product decision support through `PAR-05`
- UX cleanup through `PAR-03`

### Auth/Access

- Security review through `PAR-02`
- Route and UX cleanup through `PAR-03` and `PAR-04`

### Product UX

- `PAR-03` UX Honesty Pass
- `PAR-04` Navigation And Route Cleanup
- `PAR-05` Product Decision Log

### Quality/Ops

- `PAR-06` Testing Expansion
- `PAR-07` Maintenance And Data Lifecycle

## Recommended Parallel Execution Rules

- Start `PAR-01`, `PAR-02`, `PAR-03`, `PAR-04`, `PAR-05`, and `PAR-07` immediately if team capacity exists
- Start `PAR-06` after `CORE-04` establishes the live API-backed editor shape
- Re-run `PAR-03` and `PAR-04` as final cleanup after `CORE-08` and `CORE-09`
- Keep `CORE-10` as the only final MVP acceptance gate even if parallel tickets continue afterward
