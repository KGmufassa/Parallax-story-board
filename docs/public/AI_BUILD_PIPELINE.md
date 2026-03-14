# AI Application Development Pipeline

This document describes the **full autonomous development pipeline** used by the AI project system.

The system converts a **raw idea → fully structured implementation plan** using staged architecture generation.

Each stage produces **artifacts stored in `docs/reference/`**, which are used by subsequent commands.

---

# Pipeline Overview

```
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
↓
Implementation Phase
```

Each step progressively **reduces ambiguity** and **adds technical structure**.

---

# 1. Brainstorm

Command:

```
/brainstorm
```

## Purpose

Transform a **raw brain dump of ideas** into a **structured concept draft**.

This stage focuses on **clarifying the product idea**.

## Inputs

Either:

```
context window text
```

or

```
/brainstorm <file>
```

Example:

```
/brainstorm idea.txt
```

## What the Command Does

1. Reads the user brain dump
2. Extracts:
   - product idea
   - user goals
   - features
   - application theme
3. Researches industry patterns
4. Asks clarifying questions
5. Challenges assumptions
6. Suggests potential tech stacks

## Question Layers

### Product Questions

Example:

```
Who is the primary user?
What problem does the app solve?
What makes this product unique?
```

### Feature Questions

Example:

```
What are the core features required for MVP?
Which features require backend services?
Which features are UI-only?
```

### Architecture Questions

Example:

```
Will the app require real-time updates?
Will authentication be required?
Does the system require background workers?
```

## Output Artifact

```
docs/reference/prd-draft.md
```

This is a **draft PRD used for design generation**.

---

# 2. UI Prompt Builder

Command:

```
/ui-prompt-builder
```

## Purpose

Generate a **prompt for the Google Stitch UI builder** based on the PRD draft.

## Inputs

```
docs/reference/prd-draft.md
```

## What the Command Does

1. Extracts features from the PRD draft
2. Derives possible UI pages
3. Identifies UX patterns
4. Asks UI clarifying questions
5. Builds a structured UI prompt

## Output

A prompt usable in **Google Stitch**.

---

# 3. UI Design Generation (Google Stitch)

This stage is **manual**.

The user submits the generated prompt to:

```
Google Stitch
```

## Output

The UI builder generates HTML layouts saved in:

```
design/
```

Example structure:

```
design/
  stitch/
    landing-page.txt
    dashboard-page.txt
    project-page.txt
```

These files contain **raw HTML source code**.

---

# 4. Extract Design Spec

Command:

```
/extract-design-spec
```

## Purpose

Convert **HTML design code** into a **structured UI architecture specification**.

## Inputs

```
design/
```

HTML source files.

## What the Command Does

Analyzes:

- HTML structure
- Tailwind styles
- components
- layout containers

Extracts:

```
pages
components
layouts
design tokens
navigation
```

## Output

```
docs/reference/frontend-design-spec.md
```

---

# 5. Generate Frontend Architecture

Command:

```
/generate-frontend-architecture
```

## Purpose

Convert the design specification into a **formal frontend architecture document**.

## Inputs

```
docs/reference/frontend-design-spec.md
docs/reference/prd-draft.md
```

## What the Command Generates

Defines:

```
framework
routing system
layout architecture
component hierarchy
state management
API consumption model
UI dependency graph
page wiring graph
```

## Output

```
docs/reference/frontend-architecture.md
```

---

# 6. Stack Advisor

Command:

```
/stack-advisor
```

## Purpose

Determine the **complete technology stack**.

## Inputs

```
docs/reference/frontend-architecture.md
docs/reference/prd-draft.md
```

## Process

1. Detects frontend stack
2. Asks backend stack questions
3. Determines:

```
backend framework
database
ORM
authentication
deployment target
testing framework
```

## Outputs

```
docs/reference/stack.md
docs/reference/backend-architecture.md
```

---

# 7. Backend Architecture

Generated during stack advisor.

## Purpose

Define backend system structure.

## Architecture Includes

```
controllers
services
repositories
models
routes
middleware
configuration
```

Example structure:

```
src/
controllers/
services/
repositories/
models/
routes/
middleware/
config/
```

## Output

```
docs/reference/backend-architecture.md
```

---

# 8. Generate Stack Guidelines

Command:

```
/generate-stack-guidelines
```

## Purpose

Retrieve **official best practices** using **Context7 MCP**.

## Output

```
docs/reference/stack-guidelines.md
```

Contents include:

```
project structure
service layer patterns
configuration patterns
security practices
performance patterns
testing practices
deployment patterns
```

---

# 9. Finalize PRD

Command:

```
/finalize-prd
```

## Purpose

Create the **final authoritative PRD**.

## Inputs

```
docs/reference/prd-draft.md
docs/reference/frontend-architecture.md
docs/reference/backend-architecture.md
docs/reference/stack.md
docs/reference/frontend-design-spec.md
```

## Output

```
docs/reference/prd.md
```

Includes:

```
product vision
feature list
functional requirements
system architecture
data models
UI structure
tech stack
MVP scope
non-functional requirements
```

---

# 10. Generate Plan

Command:

```
/generate-plan
```

## Purpose

Generate the **technical build plan**.

## Inputs

```
frontend-architecture.md
backend-architecture.md
stack.md
prd.md
stack-guidelines.md
```

## Output

```
docs/reference/plan.md
```

### Infrastructure Phase

```
environment setup
database initialization
container configuration
```

### Core Module Setup

```
authentication
logging
configuration
```

### Backend Implementation

```
controllers
services
repositories
models
```

### Frontend Implementation

```
layouts
components
hooks
pages
```

### Feature-by-Feature Breakdown

Each feature defines:

```
frontend components
backend services
API endpoints
data models
```

### Cross-Cutting Concerns

```
authentication
authorization
logging
error handling
```

### Performance Strategy

```
database indexing
API caching
lazy loading
```

### Security Enforcement

```
input validation
auth guards
rate limiting
```

### Validation Checklist

Ensures:

```
features implemented
APIs wired
tests written
```

### Deployment Strategy

```
CI/CD pipeline
database migrations
environment configuration
```

---

# Architecture Rules

Generated alongside the plan.

Output:

```
docs/reference/architecture-rules.md
```

Purpose:

Prevent architectural drift.

Example rules:

```
controllers cannot access database directly
repositories handle database queries
services contain business logic
UI cannot call database directly
```

---

# Final Artifacts Generated

```
docs/reference/

prd-draft.md
frontend-design-spec.md
frontend-architecture.md
backend-architecture.md
stack.md
stack-guidelines.md
prd.md
plan.md
architecture-rules.md
```

---

# Next Stage: Implementation Pipeline

Example commands:

```
scaffold-project
build-database
build-backend
build-frontend
write-tests
run-tests
qa-review
```

---

# Key Benefit of This System

The pipeline ensures:

```
ideas → architecture → implementation plan
```

This reduces:

```
architecture mistakes
feature ambiguity
stack incompatibilities
technical debt
```



scaffold-project
build-database
build-backend
build-frontend
write-tests
run-tests
qa-review
