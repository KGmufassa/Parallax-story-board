# Saved Projects Dashboard

Design the Saved Projects Dashboard for `Parallax Story Composer`.

Use the shared design system in `design/webpages/00-shared-design-system.md` exactly.

## Route

`/projects`

## Purpose

- Give authenticated users a home for saved project management
- Reinforce the value of account ownership and persistence
- Serve as the `Projects` destination in the global navbar

## Primary User Flow

1. Authenticated user opens dashboard
2. User sees saved projects with statuses
3. User chooses to open editor, preview, export, or delete a project
4. User can create a new project

## Required Layout

- Consistent global navbar
- Header section with title and CTA
- Filter/sort controls
- Project grid or list
- Empty state for users with no projects

## Navbar Requirement

- Use the shared global navbar exactly
- The landing destination in the navbar must be labeled `Home`
- The project hub destination in the navbar must be labeled `Projects`
- `Home` routes to `/`
- `Projects` routes to `/projects`
- `New Project` routes to `/projects/new`
- `Settings` routes to `/settings`

## Required Sections

### 1. Header

- Title like `Projects`
- Supporting text
- `New Project` button

Supporting text should clarify that users can continue existing projects or create new ones from this page.

### 2. Controls Row

- Search input
- Sort dropdown
- Filter controls
- Status filter if useful

### 3. Project Cards or Rows

Each project item should include:

- Project title
- Cover thumbnail or preview tile
- Last updated
- Status badge: `Draft`, `Processing`, `Renderable`
- Scene count or project metadata
- Quick actions:
  - `Open Editor`
  - `Preview`
  - `Export`
  - `Delete Project`

### 4. Empty State

- Friendly illustration or dark premium placeholder
- CTA to create first project

## Required Buttons

- `New Project`
- `Open Editor`
- `Preview`
- `Export`
- `Delete Project`
- `Sort / Filter`

## Interaction Intent

- `Open Editor` routes into project editor
- `Preview` opens player page
- `Export` is only available when applicable
- `Delete Project` requires confirmation
- `New Project` routes to `/projects/new`

## Design Notes

- Keep dashboard elegant and creator-focused
- Avoid generic admin UI feeling
- Use consistent card treatments, status chips, and navbar
- Maintain the same dark grey and neon green design language
- The navbar item for this page must be labeled `Projects`
