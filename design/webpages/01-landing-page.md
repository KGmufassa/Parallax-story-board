# Landing Page

Design the Landing Page for `Parallax Story Composer`.

Use the shared design system in `design/webpages/00-shared-design-system.md` exactly.

## Route

`/`

## Purpose

- Introduce the product clearly and fast
- Explain that the app turns multiple static images into one stitched parallax story
- Let users start as guest or authenticate
- Set expectations that preview is available to guests, while save and export require login
- Represent the `Home` destination in the global navbar

## Navbar Requirement

- Use the shared global navbar exactly
- The landing page nav label must be `Home`
- `Home` routes to `/`
- `Projects` routes to `/projects`
- `New Project` routes to `/projects/new`
- `Settings` routes to `/settings`

## Primary User Flow

1. User lands on the page
2. User understands the product in a few seconds
3. User chooses `Start Free as Guest`, `Create Account`, or `Log In`
4. User continues into project creation

## Required Layout

- Consistent global navbar
- Hero section
- Home explainer section
- How it works section
- Feature/value section
- Save/export gating explanation
- Footer or final CTA band

## Required Sections

### 1. Hero Section

- Strong headline about turning still images into stitched parallax stories
- Supporting copy explaining upload -> scene build -> motion -> stitched preview
- Large visual showing a dark vertical story player or layered editor mock
- Primary CTA buttons:
  - `Start Free as Guest`
  - `Create Account`
- Secondary CTA:
  - `Log In`

### 2. How It Works

- 3 or 4 steps:
  - Upload images
  - Build scenes
  - Add motion direction
  - Preview stitched story
- Show portrait-oriented scene visuals

### 3. Feature Highlights

- Scene manager
- AI layer decomposition
- Motion planning
- Stitched scroll engine
- Mobile-first preview

### 4. Save/Export Explanation

- Guests can preview
- Authenticated users can save and export
- Make this clear but not punitive

## Required Buttons

- `Start Free as Guest`
- `Create Account`
- `Log In`
- `See How It Works`

## Interaction Intent

- `Start Free as Guest` begins a temporary project flow
- `Create Account` and `Log In` route to auth
- `See How It Works` scrolls to the explainer section

## Design Notes

- Make the hero feel cinematic and premium
- Use neon green sparingly but confidently for CTA hierarchy
- Keep visual emphasis on portrait storytelling
