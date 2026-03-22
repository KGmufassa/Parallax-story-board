# Core System Tickets

## Purpose

This document contains the canonical dependency-ordered ticket list for the MVP. These tickets form the critical path and should be executed in order unless a later ticket is explicitly unblocked.

## Canonical Order

### CORE-01 Platform Bootstrap

**Subsystem:** Platform/System

**Goal:** Make the app boot reliably in local development with the minimum required runtime dependencies.

**Tasks**

- Stand up PostgreSQL and validate `DATABASE_URL` against `prisma/schema.prisma`
- Validate minimum required env values from `src/config/env.ts`
- Add a local bootstrap runbook using `.env.example`, Prisma, and `npm` scripts
- Add Prisma migration or deploy and Prisma client generation to the startup flow
- Verify `src/interfaces/http/controllers/health-controller.ts` reflects real readiness behavior

**Dependencies:** None

**Unblocks**

- `CORE-02`
- `CORE-04`
- `CORE-08`

### CORE-02 Upload Storage Implementation

**Subsystem:** Platform/System, Media Pipeline

**Goal:** Make uploads persist actual file bytes instead of only verifying upload tokens.

**Tasks**

- Implement byte persistence in `src/app/api/v1/uploads/[uploadToken]/route.ts`
- Define local development storage location and MVP deployment storage target
- Validate upload token metadata against the stored object
- Ensure uploaded originals are recoverable by project and scene workflows

**Dependencies**

- `CORE-01`

**Unblocks**

- `CORE-03`
- `CORE-06`

### CORE-03 Asset Delivery Layer

**Subsystem:** Platform/System, Media Pipeline

**Goal:** Make asset paths renderable everywhere the product expects media.

**Tasks**

- Make paths from `src/modules/assets/pathing.ts` resolvable by the app
- Serve originals, thumbnails, layers, composite, and manifest assets
- Ensure dashboard, editor, and preview receive renderable URLs
- Confirm playback plans can reference URLs that the browser can actually load

**Dependencies**

- `CORE-02`

**Unblocks**

- `CORE-06`
- `CORE-07`
- `CORE-09`

### CORE-04 Live Editor Data Wiring

**Subsystem:** Projects/Scenes

**Goal:** Replace mock-backed editor loading and persistence with live project and scene APIs.

**Tasks**

- Remove editor dependence on `src/features/projects/mock-projects.ts`
- Load real project and scene data in `src/features/projects/components/project-editor-page.tsx`
- Persist project edits through `PATCH /api/v1/projects/[projectId]`
- Persist scene edits through `PATCH /api/v1/scenes/[sceneId]`
- Surface real scene and project state in the editor

**Dependencies**

- `CORE-01`

**Unblocks**

- `CORE-05`
- `CORE-08`
- `CORE-09`

### CORE-05 Scene Operations In Editor

**Subsystem:** Projects/Scenes

**Goal:** Make the editor usable for the MVP scene lifecycle.

**Tasks**

- Implement reorder UI using `POST /api/v1/projects/[projectId]/scenes/reorder`
- Implement delete action using the existing scene delete API
- Implement retry action using `POST /api/v1/scenes/[sceneId]/retry`
- Implement regenerate action using `POST /api/v1/scenes/[sceneId]/regenerate`
- Implement processing trigger flow from the editor
- Surface status transitions and failure or retry states in the UI
- Remove disabled controls that block the core workflow

**Dependencies**

- `CORE-04`

**Unblocks**

- `CORE-06`
- `CORE-07`

### CORE-06 End-To-End Processing Path

**Subsystem:** Processing/Pipeline

**Goal:** Verify the full MVP media pipeline works from finalized upload to stitched playback.

**Tasks**

- Validate finalize upload -> decomposition -> motion -> playback stitching path
- Ensure `QWEN_MOCK_MODE=true` yields a fully working local MVP path
- Confirm fallback behavior for partial-ready projects
- Confirm generated outputs are stored and referenced correctly
- Verify playback plans are created as scenes become ready

**Dependencies**

- `CORE-02`
- `CORE-03`
- `CORE-05`

**Unblocks**

- `CORE-07`
- `CORE-10`

### CORE-07 Real Preview Rendering

**Subsystem:** Preview

**Goal:** Render the MVP preview from actual playback data instead of the current demo-style presentation.

**Tasks**

- Replace the stacked preview UI in `src/features/preview/components/project-preview-page.tsx`
- Render from the playback timeline returned by `src/app/api/v1/projects/[projectId]/preview/playback/route.ts`
- Make partially processed projects preview safely with fallback behavior
- Handle missing assets and processing states without breaking the page
- Confirm reduced-motion behavior still works where supported

**Dependencies**

- `CORE-03`
- `CORE-05`
- `CORE-06`

**Unblocks**

- `CORE-10`

### CORE-08 Auth Baseline

**Subsystem:** Auth/Access

**Goal:** Make account creation, login, and guest claim flows usable in the product.

**Tasks**

- Wire signup form in `src/features/auth/components/auth-page.tsx` to `POST /api/v1/auth/register`
- Wire credentials login in `src/features/auth/components/auth-page.tsx` to NextAuth credentials sign-in
- Add post-auth redirect behavior after login and signup
- Implement guest-to-authenticated claim UX using `POST /api/v1/projects/[projectId]/claim`
- Enforce and surface guest save and export gating cleanly
- Decide whether Google auth is required or optional for MVP launch

**Dependencies**

- `CORE-01`
- `CORE-04`

**Unblocks**

- `CORE-09`
- `CORE-10`

### CORE-09 Dashboard Truthfulness

**Subsystem:** Projects/Scenes, Product UX

**Goal:** Make the dashboard reflect only real, usable product flows.

**Tasks**

- Remove mock fallback projects from `src/features/projects/components/projects-dashboard-page.tsx`
- Load real projects only from the API
- Make create, open, and resume flows work from `/projects`
- Show empty states based on real project data
- Remove or relabel disabled flows that are not part of MVP

**Dependencies**

- `CORE-03`
- `CORE-04`
- `CORE-08`

**Unblocks**

- `CORE-10`

### CORE-10 MVP Validation Gate

**Subsystem:** Quality/Ops

**Goal:** Verify the critical path is genuinely working and no longer dependent on demo behavior.

**Tasks**

- Add high-value integration coverage for guest create -> upload -> finalize -> process -> preview
- Add targeted tests for auth registration, login, and claim flow
- Run `npm run lint`
- Run targeted tests for changed modules and the MVP happy path
- Run `npm run build`
- Verify no mock data remains in core create, editor, preview, and dashboard flows

**Dependencies**

- `CORE-06`
- `CORE-07`
- `CORE-08`
- `CORE-09`

**Exit Criteria**

- Guest can create a project, upload images, process scenes, and see a real preview
- Authenticated users can sign up, sign in, save, and reopen projects
- Core flows do not depend on mock data
- The app passes lint, targeted tests, and production build
