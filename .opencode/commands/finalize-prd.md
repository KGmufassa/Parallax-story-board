---
description: Generate the finalized Product Requirements Document from architecture, stack decisions, and design specifications
agent: build
subtask: true
---

Reference Inputs:

@docs/reference/prd-draft.md
@docs/reference/frontend-architecture.md
@docs/reference/backend-architecture.md
@docs/reference/stack.md
@docs/reference/frontend-design-spec.md

---

# Objective

Generate the **final Product Requirements Document (PRD)** by consolidating the outputs of the planning and architecture stages.

The final PRD must reflect the **actual system architecture, technology stack, and UI structure**.

This document becomes the **authoritative requirements specification for the application**.

The command must **not invent features or functionality** that do not exist in the referenced documents.

---

# Step 1 — Load Draft PRD

Load:

docs/reference/prd-draft.md

Extract:

• product vision  
• problem statement  
• target users  
• initial feature ideas  

Use this as the **conceptual foundation** for the final PRD.

---

# Step 2 — Load Architecture Artifacts

Load the following architecture artifacts.

docs/reference/frontend-architecture.md  
docs/reference/backend-architecture.md  
docs/reference/stack.md  
docs/reference/frontend-design-spec.md  

Extract:

• frontend pages and UI modules  
• backend services and APIs  
• data models  
• tech stack decisions  
• system architecture  

---

# Step 3 — Derive Feature Set

Derive the **confirmed feature list** from:

Frontend pages  
UI components  
Backend services  
API endpoints  

Only include features that appear in architecture artifacts.

Do not include speculative features.

---

# Step 4 — Define Functional Requirements

For each confirmed feature:

Define:

Feature Name  
Feature Description  
User Flow  
Frontend Components  
Backend Services  
API Endpoints  
Data Requirements  

Ensure each feature maps to **both frontend and backend implementations**.

---

# Step 5 — Define System Architecture

Summarize the technical architecture.

Include:

Frontend Architecture Overview  
Backend Architecture Overview  
API Communication Model  
Data Persistence Strategy  

Use information from:

frontend-architecture.md  
backend-architecture.md  
stack.md  

---

# Step 6 — Define Technology Stack

Document the confirmed technology stack.

Include:

Frontend Framework  
Backend Runtime  
Backend Framework  
Database  
ORM / Query Layer  
Deployment Platform  

Extract from:

docs/reference/stack.md

---

# Step 7 — Define Data Model Overview

Extract primary entities from backend architecture.

Examples:

User  
Project  
Task  

Define:

Entity Name  
Purpose  
Relationships  

---

# Step 8 — Define UI/UX Structure

Extract page structure from:

frontend architecture  
design spec  

Define:

Page Name  
Route  
Purpose  
Primary Components  

---

# Step 9 — Define Non-Functional Requirements

Define system quality attributes.

Include:

Performance expectations  
Security requirements  
Scalability expectations  
Reliability expectations  

Use architecture artifacts as reference.

---

# Step 10 — Define MVP Scope

Determine the **minimum feature set required for initial release**.

Use:

PRD draft feature prioritization  
frontend page structure  
backend services  

Exclude non-essential features.

---

# Step 11 — Define Out of Scope

List features that will **not be included in the MVP**.

This prevents scope creep.

---

# Step 12 — Generate Final PRD

Structure the final document as:

# PRODUCT REQUIREMENTS DOCUMENT

## Product Overview

## Problem Statement

## Target Users

## Product Vision

---

## Feature Set

---

## Functional Requirements

---

## System Architecture

Frontend Architecture  
Backend Architecture  

---

## Technology Stack

---

## Data Model Overview

---

## UI/UX Structure

---

## Non-Functional Requirements

Performance  
Security  
Scalability  

---

## MVP Scope

---

## Out of Scope

---

# Step 13 — Save Artifact

Write the finalized PRD to:

docs/reference/prd.md

Create directory if missing.

Overwrite existing file.

---

# Completion Output

Return confirmation only:

"Final PRD generated and saved to docs/reference/prd-finalized.md"

---

# Update Project State

Update:

docs/reference/project-state.md

Phase: PRD Approved  
Last Updated: [CURRENT_TIMESTAMP]
