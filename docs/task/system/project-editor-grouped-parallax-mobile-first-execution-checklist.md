# Project Editor Grouped Parallax Mobile-First Execution Checklist

This checklist converts the grouped parallax editor plan into a strict execution sequence for implementation.

Scope for v1:

- fixed scene groups: `background`, `midground`, `foreground`
- one layer belongs to exactly one group
- user edits `mobile` mappings only
- `tablet` and `desktop` mappings are auto-derived from `mobile`
- editor must include visible buttons and functions users can operate directly

## Success Criteria

The work is complete when all of the following are true:

- a user can open a scene in the editor and see its returned layers
- a user can assign each layer to `background`, `midground`, or `foreground`
- a user can edit mobile parallax mapping for each group with visible controls
- a user can click `Save Scene Motion` and persist the config
- saving regenerates motion blueprint data and restitches playback
- the editor preview updates against the scrubber using grouped motion behavior
- `tablet` and `desktop` behavior are derived automatically from `mobile`

## Phase 1 - Define The Scene Grouping Contract

### 1.1 Update scene editor types
- File: `src/modules/scenes/types.ts`
- Add `GroupKey` as `background | midground | foreground`
- Add `EasingKey` as `linear | ease-out | ease-in-out`
- Add `MobileGroupScrollMapping`
- Add `SceneGroupConfig`
- Add `SceneGroupingConfig`
- Extend `UpdateSceneInput` to accept `grouping`

### 1.2 Lock the request payload shape
- File: `src/modules/scenes/types.ts`
- Use this v1 payload contract:

```ts
export type GroupKey = "background" | "midground" | "foreground"

export type EasingKey = "linear" | "ease-out" | "ease-in-out"

export type MobileGroupScrollMapping = {
  startProgress: number
  endProgress: number
  translateX: number
  translateY: number
  scaleFrom: number
  scaleTo: number
  opacityFrom: number
  opacityTo: number
  speedMultiplier: number
  easing: EasingKey
}

export type SceneGroupConfig = {
  groupKey: GroupKey
  layerIndexes: number[]
  mobile: MobileGroupScrollMapping
}

export type SceneGroupingConfig = {
  version: 1
  groups: SceneGroupConfig[]
}
```

### 1.3 Extend scene update validation
- File: `src/modules/scenes/validator.ts`
- Extend `updateSceneInputSchema` to accept `grouping`
- Add validation rules for:
  - only the 3 supported group keys
  - `grouping.version === 1`
  - no duplicate `layerIndexes` across groups
  - `startProgress` and `endProgress` are within `0..1`
  - `startProgress <= endProgress`
  - numeric fields stay within safe bounds

### 1.4 Add validator tests
- File: `tests/unit/modules/scenes/validator.test.ts`
- Add coverage for:
  - valid grouped payload
  - duplicate layer assignment rejection
  - invalid group rejection
  - invalid progress range rejection
  - nullable `grouping` support

## Phase 2 - Persist Grouped Editor Config On Scenes

### 2.1 Persist grouping into scene data
- File: `src/modules/scenes/repository.ts`
- Extend `update(...)` to accept `grouping`
- Persist `grouping` into `Scene.framingData`
- Preserve support for existing scene fields:
  - `contextText`
  - `motionPreset`
  - `motionIntensity`

### 2.2 Extend scene service update flow
- File: `src/modules/scenes/service.ts`
- Update the scene update flow to pass `grouping` through to the repository
- Keep service behavior architecture-aligned and small
- If helpful, add a dedicated helper for editor-config persistence

### 2.3 Add persistence tests
- File: `tests/unit/modules/scenes/service.test.ts`
- Add coverage for:
  - saving `grouping` into `framingData`
  - preserving other scene fields during grouped saves

## Phase 3 - Regenerate Motion Blueprint On Save

### 3.1 Expand motion blueprint types
- File: `src/modules/motion/types.ts`
- Keep existing blueprint structure, but expand `MotionLayerBehavior` so it can carry grouped scroll mapping output
- Add fields for:
  - `groupKey`
  - `startProgress`
  - `endProgress`
  - `translateX`
  - `translateY`
  - `scaleFrom`
  - `scaleTo`
  - `opacityFrom`
  - `opacityTo`
  - `speedMultiplier`
  - `easing`
  - resolved `mobile`, `tablet`, and `desktop` variants if needed by the renderer

### 3.2 Replace layer-order-only generation with grouping-aware generation
- File: `src/modules/motion/service.ts`
- Keep fallback behavior when `framingData` is missing
- Add grouped blueprint generation path that:
  - reads `Scene.framingData`
  - uses explicit `mobile` values from the editor
  - auto-derives `tablet` from `mobile`
  - auto-derives `desktop` from `mobile`
  - expands group mappings into per-layer behavior rows

### 3.3 Implement device auto-scaling rules
- File: `src/modules/motion/service.ts`
- Add internal helpers for:
  - `deriveTabletMapping(mobile)`
  - `deriveDesktopMapping(mobile)`
- Recommended v1 scaling:
  - `tablet.translateX = mobile.translateX * 1.2`
  - `tablet.translateY = mobile.translateY * 1.2`
  - `tablet.speedMultiplier = mobile.speedMultiplier * 1.15`
  - `tablet` scale delta from `1` multiplied by `1.08`
  - `desktop.translateX = mobile.translateX * 1.4`
  - `desktop.translateY = mobile.translateY * 1.4`
  - `desktop.speedMultiplier = mobile.speedMultiplier * 1.3`
  - `desktop` scale delta from `1` multiplied by `1.15`

### 3.4 Add grouping defaults
- File: `src/modules/motion/service.ts`
- Add a helper to auto-assign layers by depth metadata or by index when metadata is weak
- Default strategy:
  - farthest layers -> `background`
  - middle layers -> `midground`
  - nearest layers -> `foreground`
- If needed, default unassigned layers to `midground`

### 3.5 Add motion service tests
- File: `tests/unit/modules/motion/service.test.ts`
- Add coverage for:
  - grouped config expands into layer behaviors
  - device mappings derive correctly from `mobile`
  - fallback motion generation still works without grouping
  - default group assignment works when grouping is absent

## Phase 4 - Save -> Regenerate -> Stitch In The Controller

### 4.1 Update scene save controller flow
- File: `src/interfaces/http/controllers/scene-controller.ts`
- Change `update(...)` flow to:
  1. validate request body
  2. persist scene fields and grouping config
  3. regenerate motion blueprint for the updated scene
  4. stitch project playback with `allowFallback: true`
  5. return updated serialized scene

### 4.2 Ensure editor updates use the same motion pipeline as decomposition
- Files:
  - `src/interfaces/http/controllers/scene-controller.ts`
  - `src/modules/motion/service.ts`
- Do not fork a separate editor-only motion path
- Keep one shared motion generation source of truth

### 4.3 Add controller/service validation coverage
- Add or update tests around the update path if controller tests exist
- Otherwise cover the behavior through service + motion + playback tests

## Phase 5 - Carry Grouped Motion Into Playback

### 5.1 Update playback timeline generation
- File: `src/modules/playback/service.ts`
- Preserve existing timing, overlap, fallback, and reduced-motion behavior
- Ensure grouped layer behaviors are included in timeline scene output
- Keep current output backward compatible where practical

### 5.2 Expand playback tests
- File: `tests/unit/modules/playback/service.test.ts`
- Add coverage for:
  - grouped layer behavior appearing in timeline output
  - reduced motion still applying correctly
  - fallback timeline still working with grouped motion data

## Phase 6 - Normalize Grouped Data For The Client

### 6.1 Expand playback client types
- File: `src/features/preview/lib/playback-client.ts`
- Expand `PlaybackLayerBehavior`
- Extend normalized scene types so the editor can access grouped behavior cleanly
- Keep current scene asset merge logic intact

### 6.2 Expose scene framing data if needed
- Files:
  - `src/modules/assets/serialization.ts`
  - `src/interfaces/http/controllers/project-controller.ts`
- Confirm `framingData` survives serialization to the editor fetch path
- If not, explicitly include it

## Phase 7 - Add Editor Buttons, Functions, And Save Actions

### 7.1 Add editor state for grouped motion editing
- File: `src/features/projects/components/project-editor-page.tsx`
- Add state for:
  - selected group
  - editable scene grouping config
  - saved grouping snapshot for reset
  - mobile-only mapping form values

### 7.2 Add required user-facing buttons
- File: `src/features/projects/components/project-editor-page.tsx`
- Add visible buttons/tabs for:
  - `Mobile`
  - `Background`
  - `Midground`
  - `Foreground`
  - `Auto Assign Layers`
  - `Save Scene Motion`
  - `Reset Scene Motion`

### 7.3 Add per-layer assignment actions
- File: `src/features/projects/components/project-editor-page.tsx`
- For each layer in the active scene, render assignment controls:
  - `Assign to Background`
  - `Assign to Midground`
  - `Assign to Foreground`
- Ensure reassignment removes the layer from the previous group automatically

### 7.4 Add required editor functions
- File: `src/features/projects/components/project-editor-page.tsx`
- Implement:
  - `handleSelectGroup(groupKey)`
  - `handleAssignLayerToGroup(layerIndex, groupKey)`
  - `handleAutoAssignLayers()`
  - `handleGroupMappingChange(groupKey, field, value)`
  - `handleSaveSceneMotion()`
  - `handleResetSceneMotion()`
  - optional `handlePreviewReset()`

### 7.5 Add group mapping controls
- File: `src/features/projects/components/project-editor-page.tsx`
- Add visible controls for the selected group:
  - `Start Progress`
  - `End Progress`
  - `Translate X`
  - `Translate Y`
  - `Scale From`
  - `Scale To`
  - `Opacity From`
  - `Opacity To`
  - `Speed Multiplier`
  - `Easing`
- Use inputs that fit the current editor style and can be scrubbed/tested quickly

### 7.6 Add scene save payload wiring
- File: `src/features/projects/components/project-editor-page.tsx`
- Submit the expanded `PATCH /api/v1/scenes/:id` payload on `Save Scene Motion`
- After save, reload scene + playback data through the existing project reload path

### 7.7 Add mobile-first UX copy
- File: `src/features/projects/components/project-editor-page.tsx`
- Add a small note near the device/group controls stating:
  - `Tablet and Desktop are auto-scaled from Mobile`

## Phase 8 - Render Grouped Motion In The Editor Preview

### 8.1 Upgrade the scene renderer contract
- File: `src/features/preview/components/playback-scene-renderer.tsx`
- Keep existing behavior when grouped motion data is absent
- Add grouped interpolation when grouped motion data is present

### 8.2 Implement progress interpolation per layer
- File: `src/features/preview/components/playback-scene-renderer.tsx`
- For the active device mapping, interpolate against scrub progress using:
  - `startProgress`
  - `endProgress`
  - `translateX`
  - `translateY`
  - `scaleFrom`
  - `scaleTo`
  - `opacityFrom`
  - `opacityTo`
  - `speedMultiplier`
  - `easing`

### 8.3 Keep v1 preview mobile-first
- File: `src/features/preview/components/playback-scene-renderer.tsx`
- Default editor preview to `mobile`
- Defer visible `tablet` and `desktop` preview toggles until after the mobile-first flow is working

## Phase 9 - Add Editor Styles For The New Controls

### 9.1 Add button rows and group control styles
- File: `src/app/globals.css`
- Add styles for:
  - device/group button rows
  - active selected group state
  - layer cards
  - layer assignment buttons
  - save/reset action row
  - mapping input grid

### 9.2 Preserve existing editor visual language
- File: `src/app/globals.css`
- Reuse current editor colors, spacing, border treatment, and active states
- Avoid introducing a visually disconnected sub-panel

## Phase 10 - Validation And Build Checks

### 10.1 Run narrow tests first
- Commands:
  - `npm test -- tests/unit/modules/scenes/validator.test.ts`
  - `npm test -- tests/unit/modules/scenes/service.test.ts`
  - `npm test -- tests/unit/modules/motion/service.test.ts`
  - `npm test -- tests/unit/modules/playback/service.test.ts`

### 10.2 Run repo validation
- Commands:
  - `npm run lint`
  - `npm run build`

### 10.3 Manual verification checklist
- Open the editor for a project with processed layers
- Select a scene and confirm layers are listed
- Assign layers into all 3 groups
- Change mobile mapping values and scrub preview
- Click `Save Scene Motion`
- Confirm playback restitches and preview reflects the changes
- Reload the editor and confirm the saved grouping persists

## Exact File Targets

- `src/modules/scenes/types.ts`
- `src/modules/scenes/validator.ts`
- `src/modules/scenes/service.ts`
- `src/modules/scenes/repository.ts`
- `src/interfaces/http/controllers/scene-controller.ts`
- `src/modules/motion/types.ts`
- `src/modules/motion/service.ts`
- `src/modules/playback/service.ts`
- `src/features/preview/lib/playback-client.ts`
- `src/features/preview/components/playback-scene-renderer.tsx`
- `src/features/projects/components/project-editor-page.tsx`
- `src/modules/assets/serialization.ts`
- `src/interfaces/http/controllers/project-controller.ts`
- `src/app/globals.css`
- `tests/unit/modules/scenes/validator.test.ts`
- `tests/unit/modules/scenes/service.test.ts`
- `tests/unit/modules/motion/service.test.ts`
- `tests/unit/modules/playback/service.test.ts`

## Implementation Order

1. scene types and validator
2. scene repository and service persistence
3. motion blueprint generation from `framingData`
4. scene controller save -> regenerate -> stitch flow
5. playback service and playback-client type updates
6. editor buttons, functions, and save wiring
7. renderer interpolation for grouped motion
8. styles
9. tests, lint, and build
