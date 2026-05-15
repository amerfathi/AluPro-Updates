# Preview Domain Flow MVP

## Scope
- Keep current UI drawing behavior stable.
- Make preview data a domain output instead of a primary editable truth.
- No UI redesign and no rendered-image persistence in core product definition.

## Assumptions
- Assembly preview can be represented through a domain `AssemblyTree` + configuration metadata.
- Legacy profile records can be adapted to `ProfileGeometry` zones for 2D preview semantics.
- Existing SVG renderer can continue to consume a legacy visual shape through an adapter.

## Old Flow
1. `compileAssemblyGrid` computes `visualModel` directly from rows/columns/modules.
2. `AssemblyLivePreview` renders `visualModel` as the source model.

## New Flow (MVP)
1. `compileAssemblyGrid` creates a **preview assembly tree** adapter (`AssemblyTree`).
2. A domain preview model is generated from:
   - `AssemblyTree`
   - configuration rules (rows/columns/mullions/coverage)
   - profile geometry catalog (`ProfileGeometry`)
3. The domain preview model is adapted to legacy `visualModel` for backward compatibility in UI rendering.

## Key Rule
- Core definition remains domain data (`AssemblyTree`, geometry, rules), not rendered images/snapshots.
