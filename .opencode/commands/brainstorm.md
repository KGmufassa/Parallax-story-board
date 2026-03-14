---
description: Convert a brain dump into a structured PRD draft through guided questioning
agent: build
---

# Brainstorm Command

This command converts a raw brain dump into a structured **PRD draft** through analysis and guided questioning.

The input can come from either:

1. The current conversation context
2. A file path passed as an argument
3. Direct text passed as an argument

---

# Step 1 — Determine Input Source

If `$ARGUMENTS` is provided:

Check if it matches a file path.

If the file exists:
Read the file contents.

If the argument is not a file:
Treat the argument as raw idea text.

If no argument is provided:
Use the current conversation context as the input source.

---

# Step 2 — Parse Brain Dump

Analyze the input text and extract:

• application concept  
• problem being solved  
• target users  
• mentioned features  
• UI or theme ideas  
• integrations  
• platform hints  
• data requirements  

If insufficient information exists, request a short explanation of the idea.

---

# Step 3 — Create Initial PRD Draft Structure

Organize extracted ideas into structured sections.

# PRD Draft

## App Concept

Brief description of the application idea.

---

## Problem Statement

What problem the app solves.

---

## Target Users

Identify potential user groups.

Examples:

Consumers  
Businesses  
Creators  
Developers  

---

## Core Features

Extract primary functionality.

Examples:

User accounts  
Dashboards  
Search  
Notifications  
Payments  

---

## Supporting Features

Enhancements to the main product.

Examples:

Analytics  
User profiles  
Settings  
Admin tools  

---

## Platform

Determine likely platform.

Examples:

Web application  
Mobile application  
Hybrid platform  

---

## UI / Theme Ideas

Extract UI style hints.

Examples:

Minimal UI  
Dashboard layout  
Social-style feed  
Dark mode  

---

## Integrations

List possible integrations.

Examples:

Stripe  
OAuth providers  
Email services  
Third-party APIs  

---

## Data Model Hints

Identify types of data that must exist.

Examples:

Users  
Projects  
Media  
Transactions  

---

# Step 4 — Ask Clarifying Questions

Ask structured questions **one at a time**.

Pause after each question and wait for the user to respond.

Questions should focus on:

### Problem

What specific problem does the application solve?

### Users

Who is the primary user of this product?

### Core Feature

What is the most important feature?

### Platform

Will this be:

Web  
Mobile  
Both

### Authentication

Will users need accounts?

### Data

What important data must be stored?

### Monetization

Will the app generate revenue?

---

# Step 5 — Challenge Assumptions

Ask deeper questions to expose risks.

Examples:

What feature will be hardest to implement?

What would make users switch from competitors?

What part of the system might become a scaling bottleneck?

What data privacy risks exist?

---

# Step 6 — Refine the PRD Draft

Update the PRD draft using the user's answers.

Ensure the document now contains:

• a clear application concept  
• defined users  
• a concrete feature list  
• platform definition  

---

# Step 7 — Save Brainstorm Artifact

Write the structured document to:

docs/reference/brainstorm-prd-draft.md

Create directory if missing.

Overwrite existing file if it exists.

---

# Completion Output

Return confirmation only:

PRD draft generated from brainstorm session.
---

# Update Project State

Update the following file:

docs/reference/project-state.md

Modify:

Phase: [CURRENT_COMMAND_PHASE]
Last Updated: [CURRENT_TIMESTAMP]

Save changes.
