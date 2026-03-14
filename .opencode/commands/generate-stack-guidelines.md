---
description: Generate stack-specific engineering guidelines using Context7 MCP
agent: build
subtask: true
---

Reference:

@docs/reference/stack.md

---

# Objective

Generate **engineering best-practice guidelines** for the confirmed technology stack.

These guidelines will later be used by the **architecture rule generator** to enforce correct implementation patterns.

Guidelines must be derived from:

• official documentation  
• stable best practices  
• Context7 MCP sources  

The command must **not invent practices** that are not supported by official documentation.

---

# Step 1 — Load Confirmed Stack

Load:

docs/reference/stack.md

Extract the following technologies:

Frontend Framework  
Styling Framework  
State Management System  

Backend Runtime  
Backend Framework  
API Architecture  

Database  
ORM  

Authentication System  
Deployment Platform  
Testing Framework  

---

# Step 2 — Query Context7 MCP

For each detected technology:

Query **Context7 MCP** to retrieve official best practices.

Retrieve guidance for:

• project structure  
• dependency management  
• configuration patterns  
• security considerations  
• performance recommendations  
• testing practices  
• production deployment patterns  

Important rules:

Use **stable documentation patterns only**  
Ignore experimental or deprecated features  
Focus on **current major version practices**

Do NOT include raw MCP responses.

Summarize the results into concise engineering guidelines.

---

# Step 3 — Generate Guidelines

Produce a structured guideline section for each confirmed technology.

Example structure:

## Technology

Technology Name

### Recommended Usage

Brief description of recommended usage patterns.

### Architecture Patterns

Common structural patterns recommended by official documentation.

### Configuration Guidelines

Environment configuration practices.

### Security Practices

Security recommendations.

### Performance Practices

Optimization recommendations.

### Testing Guidelines

Recommended testing approaches.

---

# Step 4 — Consolidate Guidelines

Combine all technology sections into a single artifact.

Document structure:

# STACK BEST PRACTICE GUIDELINES

## Confirmed Technology Stack

Frontend  
Backend  
Database  
ORM  
Authentication  
Deployment  

---

## Frontend Guidelines

---

## Backend Guidelines

---

## Database Guidelines

---

## API Design Guidelines

---

## Security Guidelines

---

## Testing Guidelines

---

## Deployment Guidelines

---

# Step 5 — Save Artifact

Write the generated document to:

docs/reference/stack-guidelines.md

Create directory if missing.

Overwrite existing file.

---

# Completion Output

Return confirmation only:

"Stack best practice guidelines generated."
