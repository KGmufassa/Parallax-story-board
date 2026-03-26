# Project Editor Doc Alignment Implementation Plan

This plan turns the audit into a concrete path for bringing the project editor and runtime behavior closer to the documented stitched parallax story flow.

## Goal

Bring the editor into alignment with the documented engine contract so that:

- editor mutations keep playback data current
- editor and preview share the same playback source of truth
- generated decomposition assets better reflect real provider output
- the MVP stitched preview can evolve toward true parallax playback without forking models

## Current Reality

The backend already supports most of the documented flow:

- project creation
- upload init and finalize
- scene creation and ordering
- decomposition queueing and processing
- motion blueprint generation
- playback stitching and persistence
- preview playback retrieval

The main gap is at the editor/runtime boundary:

- editor saves do not consistently regenerate playback
- editor does not consume playback plans
- preview is still an MVP stitched image player
- decomposition asset persistence is still placeholder-oriented

## Phase 1 - Keep Playback In Sync

### Objective

Make playback regeneration consistent after any editor mutation that can affect ordering, timing, motion, or renderability.

### Tasks

1. Restitch after scene updates
- Update `src/interfaces/http/controllers/scene-controller.ts`
- After `sceneService.update(...)`, call `playbackService.stitchProject(scene.projectId, { allowFallback: true, traceId: context.correlationId })`
- Preserve current access and response patterns

2. Restitch after project updates when relevant
- Update `src/interfaces/http/controllers/project-controller.ts`
- After `projectService.update(...)`, call `playbackService.stitchProject(projectId, { allowFallback: true, traceId: context.correlationId })`
- If project-level fields are not currently playback-relevant, still keep this path in place so future project-level playback metadata stays in sync

3. Keep current restitch points intact
- Do not regress reorder, delete, upload-finalize, retry, or regenerate flows
- Confirm existing behavior in:
  - `src/interfaces/http/controllers/project-controller.ts`
  - `src/interfaces/http/controllers/scene-controller.ts`
  - `src/modules/decomposition/service.ts`

### Validation

- Save scene context and confirm preview order/timing payload updates
- Save motion preset/intensity and confirm the latest playback version changes
- Save project-level fields and confirm playback can still be fetched successfully

## Phase 2 - Share Playback Normalization

### Objective

Stop duplicating playback/project fallback normalization logic across preview and future editor playback surfaces.

### Tasks

1. Extract a shared client helper
- Create a shared utility under `src/features/preview` or `src/features/projects` for:
  - JSON response parsing
  - renderable image resolution
  - project-to-preview scene normalization
  - playback-to-preview scene normalization

2. Refactor preview page to use the shared helper
- Update `src/features/preview/components/project-preview-page.tsx`
- Keep the page behavior unchanged while moving logic into reusable functions

3. Reuse the helper in the editor
- Wire the editor to use the same normalized playback data shape
- Avoid introducing an editor-only playback model

### Validation

- Confirm preview output stays unchanged
- Confirm both editor and preview resolve images and fallback scenes the same way

## Phase 3 - Expose Playback Inside The Editor

### Objective

Make the editor reflect the same stitched playback state already exposed by the preview API.

### Tasks

1. Fetch playback in the editor
- Update `src/features/projects/components/project-editor-page.tsx`
- Add a playback fetch path using `/api/v1/projects/${projectId}/preview/playback`
- Use `Promise.all` with project/session fetches where appropriate

2. Add a lightweight playback panel
- Start with a read-only playback surface inside the editor
- Show:
  - current stitched order
  - active scene timing context
  - fallback status
  - reduced-motion status if present

3. Refresh playback after explicit save
- On save, use the flow: save -> restitch on backend -> reload editor project + playback
- Avoid debounced live updates in the first pass

4. Keep preview as the full validation route
- The editor panel should be lightweight and contextual
- The dedicated preview page remains the full stitched playback screen

### Validation

- Confirm editor playback order matches preview playback order
- Confirm editor panel reflects fallback state when scenes are still processing
- Confirm editor playback updates after save, reorder, upload, delete, retry, and regenerate

## Phase 4 - Improve Decomposition Asset Truthfulness

### Objective

Replace placeholder generated asset persistence with storage behavior that reflects true provider-returned outputs.

### Tasks

1. Extend decomposition result types
- Update `src/modules/decomposition/types.ts`
- Allow returned layers to include actual asset URLs, binary references, or provider file references where available

2. Update Qwen adapter mapping
- Update `src/modules/decomposition/adapter.ts`
- Normalize real provider-returned layer output into the app contract

3. Update asset persistence
- Refactor `src/modules/assets/service.ts`
- Store real layer artifacts instead of copying the original source image into every generated path
- Keep manifest generation, but make it point to real generated assets

4. Preserve MVP fallback behavior where needed
- If mock mode remains enabled, keep mock-compatible outputs so local workflows do not break

### Validation

- Confirm scenes have distinct layer assets in persistence
- Confirm manifest metadata matches generated assets
- Confirm preview and motion generation continue to work with the richer asset contract

## Phase 5 - Evolve Toward True Parallax Playback

### Objective

Move from the current stitched image/timing preview toward a frontend runtime that more closely matches the reference docs.

### Tasks

1. Define a frontend playback renderer contract
- Use playback plan scene timing plus motion blueprint layer behaviors as the runtime contract
- Keep the backend as the source of truth

2. Add a first real layered scene renderer
- Start with a single-scene layered preview component
- Render layer assets with parallax, scale, opacity, and camera movement behaviors

3. Expand to stitched multi-scene playback
- Reuse the same scene renderer in preview and later editor surfaces
- Keep fallback handling for partially ready projects

4. Support reduced motion from the same contract
- Respect reduced-motion playback versions and layer multipliers already produced by the backend

### Validation

- Confirm renderer uses generated layer assets, not only flat source or thumbnail images
- Confirm reduced-motion output differs correctly from standard playback
- Confirm fallback playback remains usable when only some scenes are ready

## Suggested Delivery Order

1. Phase 1 - restitch on update
2. Phase 2 - shared normalization helpers
3. Phase 3 - editor playback panel
4. Phase 4 - true decomposition asset persistence
5. Phase 5 - true layered parallax runtime

## File Targets

- `src/features/projects/components/project-editor-page.tsx`
- `src/features/preview/components/project-preview-page.tsx`
- `src/interfaces/http/controllers/scene-controller.ts`
- `src/interfaces/http/controllers/project-controller.ts`
- `src/interfaces/http/controllers/preview-controller.ts`
- `src/modules/playback/service.ts`
- `src/modules/motion/service.ts`
- `src/modules/decomposition/adapter.ts`
- `src/modules/decomposition/types.ts`
- `src/modules/assets/service.ts`

## Definition Of Done

The implementation can be considered aligned enough for the next milestone when all of the following are true:

- editor save mutations restitch playback consistently
- editor consumes the same playback output as preview
- preview and editor share normalization logic
- generated asset persistence reflects real decomposition outputs more accurately
- the runtime direction no longer depends on a separate editor-only playback model
