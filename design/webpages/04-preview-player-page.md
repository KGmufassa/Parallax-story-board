# Preview / Player Page

Design the Preview / Player Page for `Parallax Story Composer`.

Use the shared design system in `design/webpages/00-shared-design-system.md` exactly.

## Route

`/projects/[projectId]/preview`

## Purpose

- Present the final stitched vertical parallax experience
- Let users review the continuous scrolling story in a dedicated player environment

## Primary User Flow

1. User arrives from editor or dashboard
2. App shows the stitched story in a centered vertical stage
3. User scrolls through or restarts preview
4. User returns to edit, save, or export

## Required Layout

- Consistent global navbar
- Large centered `9:16` vertical player stage
- Minimal surrounding chrome
- Compact controls area
- Optional scene progress/timeline indicator

## Navbar Requirement

- Use the shared global navbar exactly
- Keep `Home`, `Projects`, `New Project`, and `Settings` naming consistent with the rest of the app
- `Home` routes to `/`
- `Projects` routes to `/projects`
- `New Project` routes to `/projects/new`
- `Settings` routes to `/settings`

## Required Sections

### 1. Player Stage

- Dominant vertical preview frame
- Dark immersive surroundings
- Visual language should suggest continuous stitched playback, not separate slides

### 2. Playback Controls

- `Back to Editor`
- `Restart Preview`
- `Save`
- `Export`
- `Reduce Motion`

### 3. Side or Lower Info Area

- Project title
- Playback status
- Scene progress or timeline hint
- Optional guest gating message

## Required Buttons

- `Back to Editor`
- `Restart Preview`
- `Save`
- `Export`
- `Reduce Motion`

## Interaction Intent

- `Back to Editor` returns to editor
- `Restart Preview` restarts the stitched story
- `Save` and `Export` are gated for guests
- `Reduce Motion` switches to lower-intensity playback mode

## Design Notes

- Keep the page cinematic and focused
- Use the same navbar style as all other pages
- Make the vertical stage feel premium and social-first
- Neon green should highlight active controls and progress accents
