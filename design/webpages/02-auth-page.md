# Authentication Page

Design the Authentication Page for `Parallax Story Composer`.

Use the shared design system in `design/webpages/00-shared-design-system.md` exactly.

## Route

`/auth`

## Purpose

- Let users sign up or log in
- Explain the value of authentication: save, revisit, export
- Maintain consistent premium creator-tool branding

## Primary User Flow

1. User arrives from landing or auth gate
2. User chooses sign up or log in
3. User completes auth
4. User is returned to intended destination

## Required Layout

- Consistent global navbar
- Centered or split auth card layout
- Benefits panel
- Optional social auth area

## Navbar Requirement

- Use the shared global navbar exactly
- The landing destination in the navbar must be labeled `Home`
- The project hub destination in the navbar must be labeled `Projects`
- `Home` routes to `/`
- `Projects` routes to `/projects`
- `New Project` routes to `/projects/new`
- `Settings` routes to `/settings`

## Required Sections

### 1. Auth Card

- Tabs or segmented control for `Sign Up` and `Log In`
- Fields for email and password
- Modern polished form styling
- Strong focus states in neon green

### 2. Benefits Panel

- Save projects
- Revisit later
- Export stitched stories
- Manage projects from dashboard

### 3. Guest Reminder

- Small note that guest preview is available, but persistence requires an account

## Required Buttons

- `Create Account`
- `Log In`
- `Continue with Google`
- `Back to Home`

## Interaction Intent

- Successful auth unlocks persistence and export
- Page should feel like unlocking premium workflow capability
- `Back to Home` returns the user to `/`

## Design Notes

- Keep auth flow elegant, minimal, and dark
- Avoid corporate enterprise auth styling
- Reuse navbar exactly from landing page
