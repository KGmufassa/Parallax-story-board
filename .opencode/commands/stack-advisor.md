---
description: Confirm frontend stack and derive backend architecture aligned with the PRD draft and frontend architecture
agent: build
subtask: true
---

Reference:

@docs/reference/prd-draft.md
@docs/reference/frontend-architecture.md

---

# Objective

Determine the **complete full-stack architecture** of the application.

This command must:

1. Analyze the **PRD draft**
2. Analyze the **frontend architecture**
3. Infer backend requirements
4. Ask **targeted architecture questions**
5. Finalize the **technology stack**
6. Generate the **backend architecture specification**

The goal is to ensure the **backend architecture directly supports the product requirements and UI structure**.

---

# Step 1 — Load PRD Draft

Load:

docs/reference/prd-draft.md

Extract:

Product features  
User workflows  
Data entities  
Authentication needs  
Integration requirements  

Identify backend implications such as:

Persistent data storage  
User account systems  
File uploads  
Real-time features  
External integrations  

---

# Step 2 — Load Frontend Architecture

Load:

docs/reference/frontend-architecture.md

Extract:

Frontend framework  
Routing structure  
API interaction patterns  
State management approach  

Identify:

Frontend hooks  
API endpoints required  
Frontend data dependencies  

---

# Step 3 — Extract design specs 

Load:

docs/reference/frontend-design-spec.md

Extract:

Pages  
Components  
Layouts  
User interaction flows  

Use this to identify backend needs such as:

Data fetching requirements  
Search/filter operations  
User dashboards  
Content creation features  

---

# Step 4 — Infer Backend Requirements

Using the PRD and UI architecture, determine backend needs.

Example detections:

User authentication system  
CRUD APIs for entities  
File storage  
Notification systems  
Real-time communication  
Background job processing  

These inferred requirements should guide the backend stack selection.

---

# Step 5 — Confirm Frontend Stack

Display detected frontend stack.

Example:

Frontend Framework: Next.js  
Styling: TailwindCSS  
Routing: App Router  
State Management: React Hooks  

Ask the user to confirm or correct the frontend stack.

---

# Step 6 — Backend Architecture Questionnaire

Using the PRD and frontend architecture, ask targeted questions about backend design.

Ask all questions **in one output** so the user can respond in a single reply.

---

## Backend Runtime

Based on the product requirements, which runtime should power the backend?

Examples:

Node.js  
Python  
Go  
Java  

---

## Backend Framework

Which framework should be used?

Examples:

Express  
NestJS  
FastAPI  
Django  

---

## API Style

Based on the frontend data needs, which API architecture should be used?

Options:

REST  
GraphQL  
tRPC  

---

## Database

What database is best suited for the application's data model?

Examples:

PostgreSQL  
MySQL  
MongoDB  

---

## ORM / Query Layer

Which database abstraction layer should be used?

Examples:

Prisma  
Drizzle  
SQLAlchemy  

---

## Authentication Strategy

How should authentication be implemented?

Examples:

JWT tokens  
Session cookies  
OAuth providers  

---

## File Storage

Does the application require file uploads or media storage?

Examples:

S3  
Cloud storage  
Local storage  

---

## Real-Time Features

Does the application require real-time updates?

Examples:

WebSockets  
Server-Sent Events  

---

## Background Processing

Does the application require background jobs?

Examples:

Queue workers  
Task schedulers  

---

## Deployment Target

Where will the backend be deployed?

Examples:

AWS  
Vercel serverless  
Fly.io  
Docker containers  

---

## Testing Framework

Which testing framework should be used?

Examples:

Jest  
Vitest  
Pytest  

---

# Step 7 — Validate Stack Compatibility

Ensure backend choices are compatible with the frontend architecture.

Example validations:

Next.js frontend → REST or GraphQL APIs  
Serverless frontend → stateless backend services  

Flag incompatibilities and suggest alternatives.

---

# Step 8 — Generate Backend Architecture

Create a backend architecture aligned with the application requirements.

Include:

Controller layer  
Service layer  
Repository layer  
Data models  
API routing  

Example structure:
src/

controllers/
services/
repositories/
models/
routes/
middleware/
config/


---

# Step 9 — Define API Contract

Derive API endpoints from:

PRD features  
Frontend page data needs  

Example:

GET /api/projects  
POST /api/projects  
GET /api/users  

Map these endpoints to frontend hooks.

---

# Step 10 — Produce Stack Definition

Output structured architecture:

# FULL STACK ARCHITECTURE

## Frontend Stack

Framework  
Styling  
Routing  
State Management  

---

## Backend Stack

Runtime  
Framework  
Database  
ORM  
Authentication  

---

## Backend Architecture

Controllers  
Services  
Repositories  
Models  

---

## API Contract

List required endpoints.

---

## Deployment Strategy

Define infrastructure approach.

---

# Step 11 — Save Artifacts

Save stack definition:

docs/reference/stack.md

Save backend architecture:

docs/reference/backend-architecture.md

Create directories if missing.

Overwrite existing files.

---

# Completion Output

Return confirmation only:

"Stack confirmed and backend architecture generated."
