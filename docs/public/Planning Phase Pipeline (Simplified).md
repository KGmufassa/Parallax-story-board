
# AI App Development Pipeline (Simplified)

This document outlines the simplified workflow used by the AI system to turn a raw app idea into a structured build plan.

The system progressively converts **ideas → architecture → implementation plan**.

---

# Pipeline Overview

Brainstorm  
↓  
PRD Draft  
↓  
UI Prompt Builder  
↓  
UI Design Generation (Google Stitch)  
↓  
Extract Design Spec  
↓  
Frontend Architecture  
↓  
Stack Advisor  
↓  
Backend Architecture  
↓  
Stack Guidelines  
↓  
Finalize PRD  
↓  
Generate Plan  

---

# 1. Brainstorm

Command:

/brainstorm

Purpose:

Organizes a raw brain dump into structured product ideas.

The system:
- Extracts features
- Clarifies the product idea
- Asks questions about functionality and architecture
- Suggests possible tech stacks

Output:

docs/reference/prd-draft.md

---

# 2. UI Prompt Builder

Command:

/ui-prompt-builder

Purpose:

Creates a prompt for generating UI designs in Google Stitch using the PRD draft.

Output:

Prompt used to generate UI layouts.

---

# 3. UI Design Generation

Manual step.

The generated prompt is used in Google Stitch to create UI layouts.

The resulting HTML files are saved in:

design/

---

# 4. Extract Design Spec

Command:

/extract-design-spec

Purpose:

Analyzes the HTML UI design files and converts them into a structured design specification.

Extracted information includes:
- pages
- components
- layouts
- design tokens

Output:

docs/reference/frontend-design-spec.md

---

# 5. Frontend Architecture

Command:

/generate-frontend-architecture

Purpose:

Transforms the design specification into a formal frontend architecture.

Defines:
- routing
- layouts
- component hierarchy
- UI modules

Output:

docs/reference/frontend-architecture.md

---

# 6. Stack Advisor

Command:

/stack-advisor

Purpose:

Determines the full application technology stack.

Defines:
- frontend framework
- backend framework
- database
- ORM
- deployment platform

Outputs:

docs/reference/stack.md  
docs/reference/backend-architecture.md

---

# 7. Backend Architecture

Purpose:

Defines the backend system structure including:

- controllers
- services
- repositories
- models
- routes

Output:

docs/reference/backend-architecture.md

---

# 8. Stack Guidelines

Command:

/generate-stack-guidelines

Purpose:

Uses Context7 MCP to retrieve best practices for the selected tech stack.

Includes guidance for:
- architecture patterns
- security
- testing
- deployment

Output:

docs/reference/stack-guidelines.md

---

# 9. Finalize PRD

Command:

/finalize-prd

Purpose:

Creates the final product requirements document using:

- PRD draft
- frontend architecture
- backend architecture
- stack configuration

Output:

docs/reference/prd.md

---

# 10. Generate Plan

Command:

/generate-plan

Purpose:

Creates the technical build plan for implementing the application.

The plan defines:
- infrastructure setup
- backend implementation
- frontend implementation
- feature breakdown
- deployment strategy

Outputs:

docs/reference/plan.md  
docs/reference/architecture-rules.md

---

# Final Artifacts

The pipeline produces the following core documents:

docs/reference/

- prd-draft.md
- frontend-design-spec.md
- frontend-architecture.md
- backend-architecture.md
- stack.md
- stack-guidelines.md
- prd.md
- plan.md
- architecture-rules.md

---

# Next Stage: Implementation

These artifacts are then used by the implementation commands such as:

- scaffold-project
- build-database
- build-backend
- build-frontend
- write-tests
- run-tests
- qa-review

---

# Summary

The system ensures that:

ideas → architecture → build plan

This structured process reduces ambiguity and keeps development aligned with the architecture.
