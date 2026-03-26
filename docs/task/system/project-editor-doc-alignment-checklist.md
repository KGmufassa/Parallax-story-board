# Project Editor Doc Alignment Checklist

This checklist maps the current codebase against:

- `docs/reference/01-stitched-parallax-story-product-flow.md`
- `docs/reference/02-stitched-parallax-story-engine-sequence.md`

Status key:

- `Implemented`: behavior is present in the current repo
- `Partial`: some behavior exists, but the implementation does not fully match the doc intent
- `Missing`: no meaningful implementation found

## Product Flow Checklist

1. `Implemented` - User lands on the app and sees the product promise in `src/features/marketing/components/landing-page.tsx`
2. `Implemented` - User can start from landing, projects, or nav and reach `/projects/new`
3. `Implemented` - Project setup form supports title, global context, and style preset in `src/features/projects/components/new-project-form.tsx`
4. `Implemented` - User can select one or more source images and see them queued
5. `Implemented` - User can reorder the initial storyboard sequence before project creation
6. `Implemented` - `Create Project` creates the project and can create a guest session first when needed
7. `Implemented` - Upload contracts are requested per file through uploads init
8. `Implemented` - Raw source files are uploaded to storage with signed upload URLs
9. `Implemented` - Upload finalize creates ordered scene records and thumbnail references
10. `Implemented` - Finalized scenes are automatically queued for decomposition
11. `Implemented` - Scene source images are dispatched into the decomposition pipeline
12. `Partial` - Qwen returns layer metadata, but frontend/runtime usage is still simplified and provider output does not appear to include distinct stored layer binaries
13. `Partial` - Returned decomposition assets are persisted, but current asset persistence copies the source image into generated paths as an MVP placeholder in `src/modules/assets/service.ts`
14. `Implemented` - Scene states move through `queued`, `processing`, and `ready`
15. `Implemented` - Motion blueprints are generated in `src/modules/motion/service.ts`
16. `Implemented` - Playback timelines are stitched and persisted in `src/modules/playback/service.ts`
17. `Implemented` - Editor workspace exists at `/projects/[projectId]/editor`
18. `Implemented` - Editor supports scene context edits, motion settings, and later uploads
19. `Implemented` - Editor shows scene processing states and lets users retry/regenerate
20. `Partial` - The engine contract exists on the backend, but the editor and preview do not yet render a true layered parallax engine on the frontend
21. `Implemented` - Preview exists at `/projects/[projectId]/preview`
22. `Partial` - Preview loads stitched playback plans, but renders an MVP vertical stitched player rather than a true parallax layer renderer
23. `Implemented` - Users can evaluate pacing, order, readiness, and continuity in preview
24. `Partial` - Users can return for revisions, reorder, retry, regenerate, delete, and upload more scenes, but normal save actions do not consistently restitch playback
25. `Partial` - The full story loop is mostly present, but true frontend parallax playback and editor playback alignment remain incomplete

## Engine Sequence Checklist

1. `Implemented` - Frontend creation starts at `/projects/new` and submits project + uploads
2. `Implemented` - `POST /api/v1/projects/[projectId]/uploads/finalize` finalizes uploads into ordered scenes
3. `Implemented` - Thumbnail paths are created and source images are copied into thumbnail storage
4. `Implemented` - Scene decomposition jobs are enqueued during finalize
5. `Implemented` - Processing dispatch exists through `src/modules/processing/service.ts` and `src/infrastructure/jobs/trigger-dev.ts`
6. `Implemented` - Decomposition adapter sends source image metadata into Qwen
7. `Partial` - Qwen returns decomposition output and layer metadata, but the downstream asset handling is still MVP-oriented
8. `Partial` - Persisted scene assets are attached to scenes, but generated layer files are currently source-image copies
9. `Implemented` - Motion blueprint generation exists and persists scene motion JSON
10. `Implemented` - Scene state progression is implemented
11. `Implemented` - Playback service stitches project scenes into a timeline with order, timing, overlap, image URLs, movement, intensity, and fallback state
12. `Implemented` - Playback plans are persisted as project playback versions
13. `Partial` - Editor loads project and scene data, but does not yet load or reflect stitched playback state
14. `Implemented` - Preview playback API exists at `GET /api/v1/projects/[projectId]/preview/playback`
15. `Partial` - Preview consumes playback plans, but only as a stitched vertical image/timing stack
16. `Partial` - Reorder, delete, upload, retry, and regenerate re-enter the pipeline, but standard save edits do not reliably trigger playback restitching

## High-Impact Mismatches

1. Editor is not connected to playback output
- `src/features/projects/components/project-editor-page.tsx` does not call `/api/v1/projects/[projectId]/preview/playback`
- The stage view is a static scene image rather than a stitched engine-driven preview

2. Playback sync is inconsistent after editor saves
- `src/interfaces/http/controllers/scene-controller.ts` update path does not restitch playback
- `src/interfaces/http/controllers/project-controller.ts` update path does not restitch playback
- Reorder and delete do restitch, so behavior is only partially aligned

3. Asset persistence is placeholder-grade for decomposition outputs
- `src/modules/assets/service.ts` copies the same source image into composite, thumbnail, and layer paths
- This does not fully satisfy the doc language around returned decomposition layer assets being stored back into the app

4. Preview is aligned to the MVP, not the long-term engine vision
- `src/features/preview/components/project-preview-page.tsx` uses a stitched vertical preview shell
- This matches `docs/setup/mvp-decision-log.md`, but only partially matches the richer parallax engine described in the reference docs

## Recommended Priority Order

1. Restitch playback after editor save mutations
2. Add shared playback normalization utilities for preview and editor
3. Load playback data inside the editor
4. Add a read-only stitched playback panel in the editor
5. Replace placeholder layer asset persistence with true provider-returned asset handling
6. Evolve preview/editor from MVP stitched image playback toward actual layered parallax rendering
