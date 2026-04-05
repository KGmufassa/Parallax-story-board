# Project Editor Element Parallax MVP Execution Plan

This plan defines the isolated worktree build for the next editor milestone: a stitched parallax composition where individually detected elements can be edited, grouped, and mapped to page scroll.

## Goal

Ship an MVP that lets a user:

- open the project editor in an isolated feature worktree
- run the app locally on `http://localhost:3001`
- view separated scene layers and detected elements
- edit per-element parallax and subtle perspective settings
- map those changes to scroll progress
- preview the stitched output using the existing playback pipeline as the source of truth

## MVP Guardrails

Build only the shortest path that reaches usable end-to-end behavior.

- keep the existing scene, layer, grouping, motion, and playback pipeline intact
- add optional element-level editing on top of the current layer-based fallback
- prefer inspector controls over canvas handles for v1
- support subtle perspective animation, not aggressive pseudo-3D warping
- defer manual masks, polygon drawing, and Photoshop-style editing

## Success Criteria

The implementation is complete when all of the following are true:

- a worktree exists on branch `feature/project-editor-element-parallax-mvp`
- the app can be launched from the isolated worktree on `localhost:3001`
- the editor can show a `Scene -> Layer -> Element` hierarchy when element data is available
- a user can select an element and edit its motion values
- a user can map per-element transform and perspective changes to normalized scroll progress
- saving regenerates motion data and refreshes stitched playback without forking a second runtime model
- the editor preview and full preview route agree on the stitched result for the active scene
- scenes without element data still work through the current layer-based fallback path

## Execution Sequence

1. Create the isolated worktree and local launch path
2. Add the element data contract without breaking layer fallback
3. Persist element-level editor config on scenes or scene assets
4. Extend motion generation to emit element behaviors
5. Extend playback output and normalization for element behaviors
6. Upgrade the editor UI for hierarchy, selection, and inspector editing
7. Upgrade the renderer for per-element transforms and subtle perspective
8. Validate with focused tests, lint, build, and manual localhost verification

## Phase 1 - Isolated Worktree And Localhost 3001

### Objectives

- keep the new work isolated from the main working tree
- make local verification explicit and repeatable

### Tasks

- create a worktree rooted at `.worktrees/project-editor-element-parallax-mvp`
- create branch `feature/project-editor-element-parallax-mvp` from `main`
- launch the app from the worktree with `PORT=3001 npm run dev`
- when auth is exercised locally, use `NEXTAUTH_URL=http://localhost:3001`

### Verification

- `git worktree list`
- `git -C .worktrees/project-editor-element-parallax-mvp status --short --branch`
- open `http://localhost:3001`

## Phase 2 - Element Editing Contract

### Objectives

- introduce an element-level editing model without replacing the existing layer model

### Tasks

- add element metadata to the scene editing contract using the smallest coherent shape
- keep layer assets as the source container for separated image data
- store per-element fields such as:
  - `id`
  - `label`
  - `sourceLayerIndex`
  - `bounds` or mask reference
  - `depth`
  - `groupKey`
  - `hidden`
- add per-element motion config fields such as:
  - `startProgress`
  - `endProgress`
  - `translateX`
  - `translateY`
  - `scaleFrom`
  - `scaleTo`
  - `opacityFrom`
  - `opacityTo`
  - `rotateXFrom`
  - `rotateXTo`
  - `rotateYFrom`
  - `rotateYTo`
  - `rotateZFrom`
  - `rotateZTo`
  - `translateZFrom`
  - `translateZTo`
  - `perspective`
  - `transformOriginX`
  - `transformOriginY`
  - `easing`

### Recommended Storage Direction

- preserve `Scene.framingData` for layer grouping compatibility
- add element editor config either:
  - under `Scene.framingData` as a versioned extension, or
  - in `Scene.motionBlueprintJson` inputs if the save flow already treats the editor as a motion authoring surface
- prefer the smallest versioned extension that avoids a Prisma migration in the first pass

## Phase 3 - Persistence And Validation

### Objectives

- allow the editor to save element-level motion settings safely

### Tasks

- extend `src/modules/scenes/types.ts` with element config types
- extend `src/modules/scenes/validator.ts` with strict bounds validation
- extend `src/modules/scenes/service.ts` and `src/modules/scenes/repository.ts` to persist the new config
- preserve support for current fields:
  - `contextText`
  - `motionPreset`
  - `motionIntensity`
  - `grouping`

### Validation

- add tests for valid and invalid element payloads
- confirm current grouped layer saves still pass unchanged

## Phase 4 - Motion Blueprint Generation

### Objectives

- use one motion pipeline for decomposition output and editor-authored output

### Tasks

- extend `src/modules/motion/types.ts` to carry optional element behaviors
- update `src/modules/motion/service.ts` to:
  - read saved element config
  - emit per-element behavior rows when available
  - preserve current per-layer behavior fallback when unavailable
- keep subtle perspective values as interpolated transform inputs, not a separate renderer mode

### Behavior Rules

- per-element motion should override per-layer motion for matching elements
- scenes with no elements continue to use the current grouped layer motion path
- reduced-motion mode should still damp motion and perspective values

## Phase 5 - Playback Contract And Client Normalization

### Objectives

- keep playback as the only frontend rendering source of truth

### Tasks

- extend `src/modules/playback/service.ts` to include element behaviors when available
- extend `src/features/preview/lib/playback-client.ts` to normalize element behavior data
- avoid building an editor-only runtime format

### Validation

- editor preview and preview page should consume the same stitched shape
- fallback scenes must remain previewable when element data is missing

## Phase 6 - Project Editor UI

### Objectives

- make the new output editable through clear, minimal controls

### Components To Add Or Evolve

- evolve `src/features/projects/components/project-editor-page.tsx`
- add a layer tree panel for `Scene -> Layer -> Element`
- add element selection state and active element highlighting
- add inspector sections for:
  - element basics
  - transform
  - parallax mapping
  - perspective mapping
- keep the current scene controls, save flow, and playback panel intact

### MVP UX Requirements

- a user can expand a layer and see its elements
- a user can select one element at a time
- a user can edit element motion numerically
- a user can save and see the stitched result update
- if element data is absent, the current layer workflow stays visible and usable

## Phase 7 - Renderer And Preview

### Objectives

- let the user preview the desired stitched parallax output directly in the editor

### Tasks

- extend `src/features/preview/components/playback-scene-renderer.tsx`
- render isolated elements above their source layer context when element behavior is present
- interpolate scroll-driven transforms for:
  - translate
  - scale
  - opacity
  - `rotateX`
  - `rotateY`
  - `rotateZ`
  - `translateZ`
  - `perspective`
  - transform origin
- preserve current layer rendering when element behavior is absent

### MVP Perspective Rule

- perspective is a 2.5D visual effect applied with CSS transforms
- do not attempt true 3D reconstruction in the MVP

## Phase 8 - Validation And Readiness

### Narrow Tests First

- `npm test -- tests/unit/modules/scenes/validator.test.ts`
- `npm test -- tests/unit/modules/scenes/service.test.ts`
- `npm test -- tests/unit/modules/motion/service.test.ts`
- `npm test -- tests/unit/modules/playback/service.test.ts`
- add the closest new tests for element config and renderer behavior

### Repo Validation

- `npm run lint`
- `npm run build`

### Manual Verification

- run the isolated worktree on `localhost:3001`
- upload an image and confirm scene creation still works
- open a processed scene and confirm layer fallback still works
- confirm element rows appear when element data is available
- edit element motion and perspective values
- scrub the editor preview and confirm the selected element changes independently
- save and confirm playback refreshes
- open the full preview route and confirm it matches the editor result closely enough for MVP use

## File Targets

- `src/features/projects/components/project-editor-page.tsx`
- `src/features/preview/components/playback-scene-renderer.tsx`
- `src/features/preview/lib/playback-client.ts`
- `src/modules/scenes/types.ts`
- `src/modules/scenes/validator.ts`
- `src/modules/scenes/service.ts`
- `src/modules/scenes/repository.ts`
- `src/modules/motion/types.ts`
- `src/modules/motion/service.ts`
- `src/modules/playback/service.ts`
- `src/interfaces/http/controllers/scene-controller.ts`
- `tests/unit/modules/scenes/*.test.ts`
- `tests/unit/modules/motion/*.test.ts`
- `tests/unit/modules/playback/*.test.ts`

## Definition Of Done

This isolated MVP can be considered complete when:

- the feature branch lives in its own worktree
- the worktree runs on `localhost:3001`
- the editor can author element-level motion for the stitched output
- scroll progress drives per-element parallax and subtle perspective changes
- the renderer uses the playback pipeline rather than a second editor-only model
- current layer-only scenes still work without migration blockers
- lint and build pass
