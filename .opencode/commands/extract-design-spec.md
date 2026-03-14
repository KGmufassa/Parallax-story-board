---
description: Reverse engineer the exported Google Stitch UI codebase and generate a technical frontend architecture specification
agent: build
subtask: true
---

Reference:

design/

@docs/templates/FRONTEND_ARCHITECTURE_TEMPLATE.md

---

# Objective

Analyze the UI code exported from **Google Stitch** and generate a **technical frontend architecture specification**.

This command must perform a **structural analysis of the HTML codebase** and derive:

• page-level architecture  
• layout hierarchy  
• reusable UI modules  
• component boundaries  
• styling architecture  
• navigation topology  
• UI dependency graph  

The goal is to transform raw UI markup into a **clear architectural representation of the frontend system**.

---

# Step 1 — Locate Design Codebase

Scan the repository directory:

design/

Recursively detect HTML source files.

Examples:

landing.html.txt  
dashboard.html.txt  
settings.html.txt  

Each file contains HTML markup exported from Google Stitch.

If no HTML sources exist:

Abort with:

"No Stitch design sources found in design directory."

---

# Step 2 — Parse DOM Structure

For each HTML file:

Construct a **DOM tree representation**.

Analyze structural nodes including:

• `<header>`  
• `<nav>`  
• `<main>`  
• `<section>`  
• `<aside>`  
• `<footer>`  

Extract hierarchical structure:


Page Root
→ Layout Containers
→ Sections
→ Nested UI Blocks


Preserve DOM hierarchy when identifying architectural boundaries.

---

# Step 3 — Identify Layout Containers

Detect layout scaffolding elements responsible for global UI structure.

Common indicators:

• navigation containers  
• persistent sidebars  
• headers  
• footers  
• global wrappers  

Derive layout modules.

Examples:

MarketingLayout  
AppLayout  
AuthLayout  

Layout responsibilities must include:

• global navigation  
• layout slots for page content  
• responsive container behavior  

---

# Step 4 — Identify UI Modules

Analyze repeated DOM patterns to identify reusable modules.

Examples:

Card components  
Form components  
Navigation elements  
Buttons  
Data tables  

Define module boundaries based on:

• repeated markup structures  
• logical UI grouping  
• component composition  

Do not alter DOM semantics during extraction.

---

# Step 5 — Detect Styling Architecture

Analyze styling framework usage.

Detect indicators for:

TailwindCSS  
Bootstrap  
Custom CSS  

Example detection signals:


tailwindcdn
class="flex grid ..."
style tags
CSS variables


Extract design tokens if available:

colors  
typography  
spacing scale  
border radius  

---

# Step 6 — Page-Level Architecture

Each HTML file represents a **page-level module**.

Derive:

Page name  
Route path  
Page purpose  

Example:

landing.html → `/`  
dashboard.html → `/dashboard`  
settings.html → `/settings`

Document page responsibilities.

---

# Step 7 — Navigation Topology

Analyze navigation structures.

Detect:

• navbar link structures  
• sidebar navigation menus  
• internal routing references  

Construct navigation graph describing how pages connect.

Example:


Landing
→ Login
→ Dashboard
→ Settings


---

# Step 8 — Component Boundary Detection

Define component boundaries using the following heuristics:

Repeated DOM segments  
Isolated UI functionality  
Encapsulated styling blocks  

Examples:

Navbar  
Sidebar  
HeroSection  
FeatureGrid  
FeatureCard  

Record parent-child relationships.

---

# Step 9 — Generate Component Graph

Produce a hierarchical UI component graph.

Example:


LandingPage
└ MarketingLayout
├ Navbar
├ HeroSection
├ FeatureGrid
│ └ FeatureCard
└ Footer


This graph must represent **composition relationships between UI modules**.

---

# Step 10 — Generate Page Wiring Graph

Define page-level wiring relationships.

Each page must include:

Route  
Layout  
Components  
Navigation relationships  

Example:


DashboardPage
Route: /dashboard

Layout
AppLayout

Components
Sidebar
DashboardHeader
ProjectList
└ ProjectCard


---

# Step 11 — Generate UI Dependency Graph

Create a dependency graph describing the **correct generation order of UI modules**.

Order should follow:

Layouts  
Shared Components  
Nested Components  
Pages  

Example:


AppLayout
Navbar
Sidebar
ProjectCard
ProjectList
DashboardHeader
DashboardPage


Resolve dependency relationships using topological ordering.

---

# Step 12 — Produce Architecture Document

Generate the frontend architecture document using:

@docs/templates/FRONTEND_ARCHITECTURE_TEMPLATE.md

Populate sections including:

Frontend framework detection  
Design system  
Page map  
Layout architecture  
Component architecture  
Component graph  
Page wiring graph  
UI dependency graph  

The document should read as a **technical architecture specification**, not a visual design description.

---

# Step 13 — Save Architecture Artifact

Write the generated architecture document to:

docs/reference/frontend-architecture.md

Create directory if missing.

Overwrite existing file.

---

# Completion Output

Return confirmation only:

"Frontend architecture generated from Stitch UI codebase."

---

# Update Project State

Update:

docs/reference/project-state.md

Phase: Frontend Architecture Generated  
Last Updated: [CURRENT_TIMESTAMP]
