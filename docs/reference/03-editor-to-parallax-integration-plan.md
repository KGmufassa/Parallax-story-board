# Editor To Parallax Integration Plan

This document outlines the recommended path for connecting the project editor to the current parallax engine without introducing regressions.

## Goal

Connect the editor to the existing engine contract so the editor can reflect the same stitched playback state already used by the preview page.

## Current State

- The editor saves project and scene fields.
- Motion blueprints are generated in the backend.
- Playback timelines are stitched in the backend.
- The preview page already consumes the stitched playback plan.
- Some editor mutations do not currently restitch playback immediately after save.

## Recommended Integration Direction

Use the existing playback engine API as the single source of truth.

- Do not build a second playback algorithm inside the editor.
- Do not drive the editor preview only from raw scene fields.
- Reuse the stitched playback output already produced by the backend.

## Phased Plan

### Phase 1: Keep playback in sync with editor mutations

1. Restitch after scene edits that affect playback.
- Scene context, motion preset, and motion intensity can affect downstream playback understanding.
- After scene update, trigger playback restitching where appropriate.

2. Restitch after project-level edits when they influence playback.
- If project-wide values become playback-relevant, keep playback regeneration tied to those mutations.

3. Keep existing reorder, delete, retry, regenerate, and upload-triggered stitching intact.
- These are already natural playback update points.

### Phase 2: Expose playback data in the editor

1. Add a playback fetch path in the editor.
- Reuse `/api/v1/projects/[projectId]/preview/playback`.
- Normalize playback data in a shared client helper.

2. Reuse preview normalization logic.
- Avoid duplicating response-shape handling across editor and preview.
- Share image fallback and timeline normalization where possible.

3. Add a lightweight engine preview surface to the editor.
- Start with a read-only stitched preview panel.
- Focus first on the active scene and timing context.

### Phase 3: Improve iteration speed

1. Refresh the embedded engine preview after explicit save.
- Recommended first behavior: save -> restitch -> refresh editor preview.

2. Add debounced refresh later if needed.
- Avoid reprocessing on every keystroke initially.
- Use a controlled, debounced update path only after the stable save-based flow is working.

3. Support reduced-motion and fallback visibility.
- Surface the same playback states already available in preview.

## Proposed User Loop

1. User edits project or scene settings in the editor.
2. User saves.
3. Backend updates scene or project state.
4. Engine regenerates the stitched playback plan.
5. Editor refreshes its embedded playback view.
6. User decides whether to continue editing or open full preview.

## Key Integration Points

### Editor
- `src/features/projects/components/project-editor-page.tsx`

### Scene update route
- `src/interfaces/http/controllers/scene-controller.ts`

### Project update and reorder routes
- `src/interfaces/http/controllers/project-controller.ts`

### Playback controller
- `src/interfaces/http/controllers/preview-controller.ts`

### Motion generation
- `src/modules/motion/service.ts`

### Playback stitching
- `src/modules/playback/service.ts`

## What To Avoid

- Do not fork a separate editor-only engine model.
- Do not patch page layout behavior while implementing engine connectivity.
- Do not trigger expensive backend work on every keystroke in the first iteration.
- Do not bypass the existing processing and playback services.

## Validation Plan

### Functional checks
- Save project and scene changes in the editor.
- Confirm playback updates after save.
- Reorder scenes and confirm stitched order updates.
- Upload new images and confirm new scenes enter the processing pipeline.
- Retry or regenerate scenes and confirm the playback plan updates.

### Playback checks
- Confirm the editor-side preview and full preview route agree on scene order and timing.
- Confirm fallback playback remains usable while some scenes are still processing.
- Confirm reduced-motion playback remains supported.

### Regression checks
- Keep preview page behavior unchanged.
- Keep existing scene processing behavior unchanged.
- Keep route and access-control behavior unchanged.

## Recommended First Implementation

1. Ensure editor mutations restitch playback consistently.
2. Add shared playback normalization utilities.
3. Add a small embedded stitched-preview surface inside the editor.
4. Validate against the existing preview route before adding live/debounced refresh.
