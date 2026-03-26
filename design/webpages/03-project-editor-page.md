# Project Editor Page

Design the Project Editor Page for `Parallax Story Composer`.

Use the shared design system in `design/webpages/00-shared-design-system.md` exactly.

## Route

`/projects/[projectId]/editor`

## Purpose

- Main workspace for building a stitched vertical parallax story
- The heart of the product

## Primary User Flow

1. User enters a project
2. User uploads multiple images
3. App creates one scene per image
4. User reorders scenes
5. User edits scene context and motion settings
6. User sets project-level direction
7. User generates processing
8. User previews stitched output

## Required Layout

- Consistent global navbar
- Top project action bar under navbar if needed
- Left sidebar: Scene Manager / Storyboard
- Center workspace: selected scene portrait stage
- Right sidebar: Scene Settings + Project Settings
- Sticky action buttons for primary actions

## Required Navbar Consistency

- Same dark navbar as other pages
- Context-aware active state for editor
- Include logo, `Home`, `Projects`, `New Project`, `Settings`, and user/auth controls
- `Home` routes to `/`
- `Projects` routes to `/projects`
- `New Project` routes to `/projects/new`
- `Settings` routes to `/settings`

## Required Sections

### 1. Top Project Actions

- `Back`
- Editable `Project Title`
- Project status badge: `Draft`, `Processing`, `Renderable`
- `Save Project`
- `Preview`
- `Export`
- `Generate`

### 2. Left Sidebar: Scene Manager

- Upload area
- `Add More Images`
- Scrollable scene list
- Portrait scene cards
- Drag handles
- Scene number and title
- Status badges: `Uploaded`, `Queued`, `Processing`, `Ready`, `Failed`
- Quick actions: `Delete`, `Retry`, `Regenerate`

### 3. Center Portrait Workspace

- Large `9:16` stage
- Selected source image or scene preview
- Framing or crop-safe overlay
- Processing overlay if active
- Suggestion that this scene becomes part of a stitched scroll experience

### 4. Right Panel: Scene Settings

- `Scene Name`
- `Scene Context Box`
- `Motion Preset` dropdown:
  - `Cinematic Push`
  - `Ambient Float`
  - `Hero Reveal`
  - `Dramatic Depth`
- `Motion Intensity` slider
- `Focus` selector:
  - `Subject`
  - `Balanced`
  - `Background`
- `Reprocess Scene` button

### 5. Right Panel: Project Settings

- `Project Context` textarea
- `Story Pace` selector:
  - `Calm`
  - `Balanced`
  - `Fast`
- `Transition Style` selector:
  - `Fade Depth`
  - `Soft Lift`
  - `Crossfade Scale`
- `Reduced Motion Preview` toggle
- `Output Format` display locked to `9:16`

## Required Buttons

- `Upload Images`
- `Add More Images`
- `Save Project`
- `Preview`
- `Export`
- `Generate`
- `Delete Scene`
- `Retry`
- `Regenerate Scene`
- `Reprocess Scene`

## Interaction Intent

- Reordering changes scene order
- Editing scene context/settings marks a scene dirty
- `Generate` processes dirty or unprocessed scenes
- `Save` and `Export` must visually support guest auth gating
- `Preview` routes to the player page

## Design Notes

- This page must feel like a premium creator studio
- The selected scene should be visually dominant
- Neon green should emphasize active scene, generate action, and ready states
- Keep the portrait workflow obvious
