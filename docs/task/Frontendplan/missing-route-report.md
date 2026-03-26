  # Missing Route Report

## Purpose

This report identifies mockup-implied frontend routes that do not currently have an app route in `src/app/`.

## Current Implemented Frontend Routes

Verified from `src/app/**/page.tsx`:

- `/`
- `/login`
- `/signup`
- `/projects`
- `/projects/new`
- `/projects/[projectId]/editor`
- `/projects/[projectId]/preview`
- `/settings`

## Missing Routes

These routes are referenced by the mockups or planning docs but do not currently have a matching page route in `src/app/`.

### High-Priority Missing Routes

- `/dashboard`
  - Referenced by:
    - `design/HTML/landing-page-design-system.html`
    - `design/HTML/project-editor-final-mvp.html`
    - `design/HTML/saved-projects-dashboard-final.html`
    - `docs/notes/button-trigger-route-audit.md`
  - Notes:
    - Used repeatedly in top navigation
    - Should likely become the authenticated home route

- `/forgot-password`
  - Referenced by:
    - `design/HTML/authentication-mvp.html`
    - `docs/notes/button-trigger-route-audit.md`
  - Notes:
    - Mockup includes `Forgot?`
    - Backend reset flow is not implemented yet

### Deferred Or Unsupported Missing Routes

- `/projects/[projectId]/export`
  - Referenced by:
    - `design/HTML/project-editor-final-mvp.html`
    - `design/HTML/saved-projects-dashboard-final.html`
    - `docs/notes/button-trigger-route-audit.md`
  - Notes:
    - Export remains unsupported in current backend planning
    - Visual trigger should stay disabled

- `/settings/security`
  - Referenced by:
    - `design/HTML/settings-page-design-system.html`
    - `docs/notes/button-trigger-route-audit.md`
  - Notes:
    - Intended for password/security actions
    - No dedicated backend flow currently exists

- `/docs`
  - Referenced by:
    - `design/HTML/landing-page-design-system.html`
    - `design/HTML/saved-projects-dashboard-final.html`
    - `docs/notes/button-trigger-route-audit.md`
  - Notes:
    - Used for `Documentation` and possibly `Features` and `Tutorials`

- `/api-reference`
  - Referenced by:
    - `design/HTML/landing-page-design-system.html`
    - `design/HTML/saved-projects-dashboard-final.html`
    - `docs/notes/button-trigger-route-audit.md`

- `/support`
  - Referenced by:
    - `design/HTML/landing-page-design-system.html`
    - `design/HTML/saved-projects-dashboard-final.html`
    - `docs/notes/button-trigger-route-audit.md`

- `/terms`
  - Referenced by:
    - `design/HTML/landing-page-design-system.html`
    - `design/HTML/saved-projects-dashboard-final.html`
    - `docs/notes/button-trigger-route-audit.md`

- `/privacy`
  - Referenced by:
    - `design/HTML/landing-page-design-system.html`
    - `docs/notes/button-trigger-route-audit.md`

### Optional Future Marketing Routes

- `/gallery`
  - Referenced by:
    - `design/HTML/landing-page-design-system.html`
    - `docs/notes/button-trigger-route-audit.md`

- `/pricing`
  - Referenced by:
    - `design/HTML/landing-page-design-system.html`
    - `docs/notes/button-trigger-route-audit.md`

- `/community`
  - Referenced by:
    - `design/HTML/landing-page-design-system.html`
    - `docs/notes/button-trigger-route-audit.md`

## Not Routes

These mockup triggers do not require standalone frontend page routes and should remain actions, disabled controls, or later component behavior:

- Notifications
- Save
- Generate
- Upload Images
- Scene refresh, delete, retry, and regenerate
- Playback controls
- Scene and Project tabs
- Reduced Motion toggles
- Filter
- Reset Defaults
- Sign Out of All Devices
- Sign Out
- Password visibility toggle

## Summary

### Missing route count

- 2 high-priority missing routes:
  - `/dashboard`
  - `/forgot-password`

- 7 deferred or support-route gaps:
  - `/projects/[projectId]/export`
  - `/settings/security`
  - `/docs`
  - `/api-reference`
  - `/support`
  - `/terms`
  - `/privacy`

- 3 optional future marketing routes:
  - `/gallery`
  - `/pricing`
  - `/community`

### Recommended implementation order

1. `/dashboard`
2. `/forgot-password`
3. Support and static routes if they need real destinations
4. Leave export, security, and marketing routes deferred unless backend or content work is approved
