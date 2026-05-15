# BOM Generation MVP (Assembly-Tree First)

## What changed

- BOM generation is now derived from `assemblyTree` (domain output) instead of direct UI-state traversal.
- The technical compiler keeps the same public production payload (`pieces`, `glass`, `accessories`) to avoid breaking current screens.
- A unified `bomItems` list is now returned from `compileTechnicalSystemWindow` for future reporting migration.

## Design assumptions

- `assemblyTree` remains the source of truth for configured element structure and section context.
- Formula metadata still comes from the current technical-system definition (`structuredFormulas`, `glassFormulas`, `accessories`) through `sourceRef`.
- Pricing/cost flow in `productionFlow` remains unchanged in this step (scope is BOM extraction only).

## Compatibility strategy

- Existing downstream modules keep receiving legacy arrays, now populated from assembly-derived BOM.
- Legacy direct-formula loops in `compileTechnicalSystemWindow` are intentionally disabled (kept in place temporarily for phased migration safety).
