# Assembly Tree MVP Integration Note

## Scope

- Implemented an initial assembly tree generator for technical-system window/door configuration.
- Kept the current app flow and compile pipeline intact.
- Added the tree as additive output from the existing compiler.

## Domain-Driven Approach

- Tree generation is based on:
  - normalized domain configuration (`ConfiguredElement`)
  - explicit assembly rules (`AssemblyRule`)
  - domain rule fixtures (`defaultAssemblyRules`)
- The generator does **not** depend on UI rendering components.

## Gradual Integration

- Existing `compileTechnicalSystemWindow` now returns:
  - `pieces`, `glass`, `accessories`, `operations` (existing behavior)
  - `assemblyTree` (new additive behavior)
- Added a helper `buildTechnicalSystemAssemblyTree` to allow future modules to consume tree output directly without touching UI state.

## Assumptions

- Accessory kinds (hinge/lock/gasket/generic) are inferred from names in this MVP.
- Section targeting follows current `sectionType` semantics (`all`, `sash`, `fixed`).
- Tree is intended as canonical structure for future BOM and preview steps, while legacy outputs remain operational.
