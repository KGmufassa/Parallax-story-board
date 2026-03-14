---
description: Generate UI dependency graph for deterministic frontend build order
agent: plan
subtask: true
---

# Generate UI Dependency Graph

Create a dependency graph describing the correct order to generate frontend UI elements.

---

# Inputs

Read:

docs/reference/frontend-architecture.md  
docs/reference/page-wiring-graph.md

---

# Step 1 — Extract UI Elements

Identify:

Layouts  
Components  
Hooks  
Pages

---

# Step 2 — Detect Dependencies

Determine relationships.

Examples:

Layout → Page  
Component → Component  
Hook → Component  
Hook → Page

---

# Step 3 — Build Dependency Graph

Create graph structure.

Example:

Navbar  
Sidebar  
MainLayout  
ProjectCard  
ProjectList  
DashboardHeader  
DashboardPage

---

# Step 4 — Resolve Generation Order

Topologically sort the graph.

Correct order must satisfy all dependencies.

Example order:

Layouts  
Shared Components  
Nested Components  
Hooks  
Pages

---

# Output

Write dependency graph to:

docs/reference/ui-dependency-graph.md

---

# Completion Output

Return confirmation only:

"UI dependency graph generated."
