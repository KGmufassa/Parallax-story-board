---
description: Generate a detailed implementation plan and architecture rules using the finalized system artifacts
agent: plan
subtask: true
---

Reference Inputs:

@docs/reference/frontend-architecture.md  
@docs/reference/backend-architecture.md  
@docs/reference/stack.md  
@docs/reference/prd.md  
@docs/reference/stack-guidelines.md  

Rules Template:

@docs/templates/ARCHITECTURE_RULES_TEMPLATE.md

---

# Objective

Generate the **complete application build plan** using the finalized architecture artifacts.

The plan must define:

• infrastructure setup  
• module creation order  
• feature-by-feature implementation  
• cross-cutting engineering concerns  
• validation and testing steps  
• deployment strategy  

The plan must also generate **architecture rules** derived from stack best practices to prevent architectural drift during implementation.

---

# Step 1 — Load Architecture Artifacts

Load:

docs/reference/frontend-architecture.md  
docs/reference/backend-architecture.md  

Extract:

Frontend pages  
UI components  
Layouts  
Backend services  
Controllers  
Repositories  
Data models  
API endpoints  

---

# Step 2 — Load Product Requirements

Load:

docs/reference/prd.md

Extract:

Confirmed feature set  
User flows  
Core product functionality  

Ensure every feature maps to both:

Frontend implementation  
Backend implementation

---

# Step 3 — Load Stack Configuration

Load:

docs/reference/stack.md

Extract confirmed stack:

Frontend framework  
Backend framework  
Database  
ORM  
Authentication  
Deployment platform  
Testing frameworks  

---

# Step 4 — Load Stack Best Practices

Load:

docs/reference/stack-guidelines.md

Extract best-practice patterns for:

Project structure  
Service layering  
API patterns  
Database usage  
Security practices  
Testing strategies  

These guidelines will be translated into **architecture rules**.

---

# Step 5 — Generate Architecture Rules

Use the template:

docs/templates/ARCHITECTURE_RULES_TEMPLATE.md

Populate rule categories using stack guidelines.

Include rules for:

Layer separation  
API structure  
Database access patterns  
UI state management  
Security enforcement  
Testing requirements  

Save rules artifact to:

docs/reference/architecture-rules.md

---

# Step 6 — Determine Build Order

Determine build dependencies from architecture artifacts.

Example order:

Infrastructure  
Database schema  
Backend services  
API endpoints  
Frontend hooks  
UI components  
Pages  

Ensure dependency ordering prevents missing modules.

---

# Step 7 — Generate Build Plan

Create structured build plan.

# APPLICATION BUILD PLAN

## Infrastructure Phase

Initialize project repository structure.

Setup:

environment configuration  
database instance  
containerization (if required)  

---

## Core Module Setup

Create foundational modules.

Examples:

authentication system  
configuration management  
logging utilities  

---

## Backend Implementation

Implement backend system layers.

Controllers  
Services  
Repositories  
Models  

Define API endpoints derived from the PRD.

---

## Frontend Implementation

Implement UI architecture.

Layouts  
Shared components  
Page components  

Wire frontend hooks to backend endpoints.

---

## Feature-by-Feature Breakdown

For each feature define:

Feature Name  
Frontend components  
Backend services  
API endpoints  
Data models  

---

## Cross-Cutting Concerns

Implement shared engineering concerns.

Authentication  
Authorization  
Error handling  
Logging  
Configuration  

---

## Performance Strategy

Apply stack-specific optimization practices.

Examples:

database indexing  
API caching  
lazy loading  

---

## Security Enforcement

Apply security best practices.

Examples:

input validation  
authentication guards  
rate limiting  

---

## Validation Checklist

Verify implementation integrity.

Examples:

all endpoints implemented  
UI components wired to APIs  
tests implemented  

---

## Deployment Strategy

Define deployment steps.

Examples:

database migrations  
environment configuration  
CI/CD pipeline  

---

# Step 8 — Save Plan Artifact

Write build plan to:

docs/reference/plan.md

Overwrite existing file if present.

---

# Completion Output

Return confirmation only:

"Implementation plan and architecture rules generated."

---

# Update Project State

Update:

docs/reference/project-state.md

Phase: Plan Generated  
Last Updated: [CURRENT_TIMESTAMP]
