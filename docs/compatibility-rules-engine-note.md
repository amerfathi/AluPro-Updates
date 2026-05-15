# Compatibility Rules Engine (Initial Scope Note)

## Scope Implemented

- Added an explicit compatibility rules engine for validation only.
- No UI rewrite.
- No assembly generation changes.
- No machining implementation.

## Assumptions

- Existing profile `systemType` is used as the primary family signal (`sliding`, `fixed`, `casement`, etc.).
- Opening direction is optional in current flows; when absent, direction defaults to `any`.
- Glass thickness is inferred from explicit fields first, then from text labels in formula/inventory names.
- Accessory type is inferred from names (e.g., roller, hinge, lock, handle) to avoid schema changes.

## Safety Decisions

- Integration is additive and backward compatible.
- Existing `validateTechnicalSystem` behavior is preserved, with compatibility issues appended to validation output.
- Runtime check in `addSmartWindow` blocks invalid combinations before production insertion.
