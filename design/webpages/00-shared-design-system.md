# Shared Design System

Create all pages in one consistent product design system for `Parallax Story Composer`.

## Brand and Mood

- Product name: `Parallax Story Composer`
- A premium AI-powered creator studio for turning still images into stitched parallax stories
- Visual direction: cinematic, futuristic, creator-focused, polished
- Avoid generic SaaS dashboard styling
- Avoid purple accents and bright white surfaces

## Theme

- Background: deep charcoal, graphite, dark slate
- Surfaces: layered dark grey panels with subtle separation
- Accent color: vivid neon green
- Text: off-white, cool light grey
- Borders: muted dark greys with neon green active and focus states
- Use subtle neon green glow for active buttons, selected cards, focused fields, and processing states

## Typography

- Bold, modern, expressive sans-serif feel
- Clear hierarchy
- High contrast and spacious layout

## Component Language

- Rounded cards and panels
- Strong spacing rhythm
- Premium buttons with subtle glow
- Portrait-first preview frames where applicable
- Status chips for `Uploaded`, `Queued`, `Processing`, `Ready`, `Failed`
- Project status chips for `Draft`, `Processing`, `Renderable`

## Global Navbar

Use the same navbar across all pages.

### Navbar Style

- Dark graphite horizontal bar
- Thin neon green accent line or glow detail
- Left: wordmark/logo `Parallax Story Composer`
- Center or right-aligned nav links depending on page
- Right side auth and user actions
- Consistent height and spacing across pages

### Navbar Elements

- Logo / wordmark
- Home
- Projects
- New Project
- Settings
- Preview when contextually relevant
- Sign In / Create Account for unauthenticated states
- User avatar/menu for authenticated states

### Navbar Order

- Left: logo / wordmark
- Middle: `Home`, `Projects`
- Right: `New Project`, `Settings`, contextual `Preview` if relevant, then auth or user actions

### Navbar Behavior

- Keep layout consistent across pages
- Highlight current page with neon green active state
- Show guest/auth state clearly
- Preserve premium dark theme across all breakpoints
- `Home` routes to `/`
- `Projects` routes to `/projects` and acts as the project hub where users continue existing projects or create new ones
- `New Project` routes to `/projects/new`
- `Settings` routes to `/settings` and contains account and preferences only in the MVP

## Global Product Rules Reflected In All Designs

- Vertical-first `9:16` storytelling
- Guests can preview only
- Save and export require authentication
- Scenes are the core building block
- Motion, stitching, and parallax preview are central concepts
