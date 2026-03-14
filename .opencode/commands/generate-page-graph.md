---
description: Generate page wiring graph from frontend architecture
agent: plan
subtask: true
---

# Generate Page Wiring Graph

Create a multi-page wiring graph that maps routes, layouts, hooks, APIs, and components.

---

# Inputs

Read:

docs/reference/frontend-architecture.md  
docs/reference/prd.md  
api/

---

# Step 1 — Identify Pages

Extract page definitions from:

frontend architecture

Examples:

LandingPage  
DashboardPage  
SettingsPage

Determine route mapping.

Example:

landing → /  
dashboard → /dashboard

---

# Step 2 — Map Layouts

Determine layout used by each page.

Examples:

MarketingLayout  
AppLayout  
AuthLayout

---

# Step 3 — Map Hooks

Determine data hooks required for each page.

Examples:

useProjects  
useActivityFeed  
useUserSettings

Hooks should correspond to page data needs.

---

# Step 4 — Map API Endpoints

Match hooks to backend endpoints.

Examples:

useProjects → GET /api/projects  
useUserSettings → GET /api/user/settings

If endpoint missing, mark:

Backend Endpoint Required

---

# Step 5 — Map Components

Determine components used by each page.

Use component hierarchy from frontend architecture.

Example:

DashboardPage
  Sidebar
  DashboardHeader
  ProjectList
    ProjectCard

---

# Step 6 — Generate Graph

Create page wiring graph.

Structure:

Page  
Route  
Layout  
Hooks  
API Endpoints  
Components

---

# Output

Write to:

docs/reference/page-wiring-graph.md

---

# Completion Output

Return confirmation only:

"Page wiring graph generated."
