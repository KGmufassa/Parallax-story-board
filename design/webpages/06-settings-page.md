# Settings Page

Design the Settings Page for `Parallax Story Composer`.

Use the shared design system in `design/webpages/00-shared-design-system.md` exactly.

## Route

`/settings`

## Purpose

- Provide an informational placeholder for settings during the MVP
- Keep future account and preference management separate from project creation and editing workflows
- Clarify that core MVP work happens in projects, editor updates, and preview

## Primary User Flow

1. User opens settings from the global navbar
2. User sees that settings are deferred for the MVP
3. User is redirected by copy toward projects, editor, or preview workflows

## Required Layout

- Consistent global navbar
- Header section with page title and supporting copy
- Informational panel layout
- Clear explanation that settings are deferred for MVP

## Navbar Requirement

- Use the shared global navbar exactly
- Keep `Home`, `Projects`, `New Project`, and `Settings` naming consistent with the rest of the app
- `Home` routes to `/`
- `Projects` routes to `/projects`
- `New Project` routes to `/projects/new`
- `Settings` routes to `/settings`

## Required Sections

### 1. Page Header

- Title like `Settings`
- Supporting text explaining that settings are deferred and not part of the MVP workflow

### 2. Deferred Scope Notice

- Explain that account preferences, saved defaults, and session controls are deferred until after MVP
- Clarify that the core MVP experience lives in projects, uploads, editor updates, preview, and guest claiming

### 3. What To Use Instead

- Point users to `Projects` for active work
- Point users to the editor for uploads and scene updates
- Point users to preview for stitched playback validation

## Required Buttons

- None required for MVP beyond global navigation

## Interaction Intent

- The page is informational during MVP and should not imply editable account or preference persistence
- The page should help users route back into active project workflows

## Design Notes

- Keep the page premium, clean, and aligned with the dark grey and neon green theme
- Make settings feel creator-oriented rather than enterprise/accounting-oriented
- Use strong section hierarchy and calm form design
- The page should feel lighter than the editor but still part of the same system
