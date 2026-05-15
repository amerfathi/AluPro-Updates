# Refactor Guardrails

This document defines mandatory safety rules for all future implementation work in this repository.

## Non-Negotiable Rules

1. Do not rewrite the project from scratch.
2. Preserve working features unless they are explicitly targeted by the current task.
3. Prefer incremental, reviewable changes over large refactors.
4. Create or update tests before changing core business logic.
5. Separate domain logic from UI gradually, not in one disruptive step.
6. Preserve backward compatibility where practical.
7. Avoid changing database schema unless required by the current task.
8. Document assumptions before implementing changes.
9. Stop after each task and summarize exactly what changed.

## Required Execution Pattern

1. State assumptions and scope for the task.
2. Implement minimal, focused changes.
3. Add/update tests when touching core business logic.
4. Validate impacted behavior.
5. Stop and provide a concise change summary before moving to the next task.
