---
description: Generate a UI prompt for Google Stitch using the PRD draft
agent: plan
---

Reference:

@docs/reference/prd-draft.md

---

# Objective

Generate a structured prompt that can be used with **Google Stitch UI builder** to create the application's frontend design.

The prompt must be derived from:

- PRD draft features
- user flows
- UI theme ideas
- platform constraints

The goal is to produce a **high-quality UI prompt** that results in realistic and usable UI prototypes.

---

# Step 1 — Load PRD Draft

Read:

docs/reference/prd-draft.md

Extract:

Application concept  
Target users  
Core features  
Supporting features  
Platform  
UI theme ideas  

---

# Step 2 — Determine UI Scope

Identify what type of interface the application requires.

Possible interface types:

Marketing site  
Dashboard application  
Mobile interface  
Admin panel  
Consumer product  

If unclear, ask the user.

Pause and wait for response.

---

# Step 3 — Ask UI Clarifying Questions

Ask questions one at a time.

Pause after each question.

Questions should include:

### Visual Style

What UI style should the app follow?

Examples:

Minimal SaaS  
Material design  
Glassmorphism  
Dark dashboard  

---

### Color Theme

Does the product have a brand color?

Example:

Green tech theme  
Blue enterprise theme  

---

### Navigation Style

How should users navigate the product?

Examples:

Sidebar navigation  
Top navigation  
Mobile tab navigation  

---

### Page Layout

Should the product be:

Card-based  
Table-based  
Feed-based  
Form-heavy  

---

### Primary User Flow

What is the most common action users perform?

Examples:

Create projects  
Upload content  
Search data  

---

### Mobile Considerations

Should the UI be optimized for mobile as well?

---

# Step 4 — Generate Page List

Using the PRD features, derive the required pages.

Example:

Landing page  
Login / Register  
Dashboard  
Projects  
Settings  

Each page should have:

Purpose  
Key components  

---

# Step 5 — Generate Component Suggestions

Derive reusable components.

Examples:

Navbar  
Sidebar  
Cards  
Tables  
Forms  
Modals  

---

# Step 6 — Construct Stitch Prompt

Build a structured prompt optimized for UI generation.

Format:

APP DESCRIPTION

USER TYPES

CORE FEATURES

PAGES

UI STYLE

NAVIGATION MODEL

COMPONENTS

DESIGN SYSTEM HINTS

---

# Step 7 — Save Prompt Artifact

Write prompt to:

docs/reference/stitch-ui-prompt.md

Overwrite if file exists.

---

# Completion Output

Return confirmation only:

"Stitch UI prompt generated."
