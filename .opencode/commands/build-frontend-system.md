---
description: Orchestrate the full frontend build pipeline
agent: build
---

# Frontend Build Orchestrator

Execute the complete frontend generation pipeline.

---

# Step 1

Run:

/extract-design-spec

---

# Step 2

Run:

/generate-page-graph

---

# Step 3

Run:

/generate-ui-dependency-graph

---

# Step 4

Run frontend implementation skill:

build-frontend

The build process must follow the generation order defined in:

docs/reference/ui-dependency-graph.md

---

# Validation

Verify:

- pages exist
- layouts exist
- components generated
- hooks wired
- API endpoints mapped

---

# Output

Return confirmation only:

"Frontend build pipeline completed."
