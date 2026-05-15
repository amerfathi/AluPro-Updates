# MVP Demo Seed Assumptions

This note documents assumptions for `src/renderer/src/domain/seeds/mvpHingedDoorDemoSeed.js`.

## Scope

- Data is explicitly demo/sample data and should not be used as purchasing master data.
- The scenario targets one single-leaf hinged door (`1.00m x 2.20m`).
- The technical flow remains backward compatible with current `compileTechnicalSystemWindow` behavior.

## Domain assumptions used in the demo

- One system is enough for MVP validation: hinged/casement door flow.
- Frame family is modeled as `door`.
- Sash family is modeled as `casement`.
- Profile geometry is semantic/domain data, not a rendered asset.
- Glazing uses one rule with an allowed thickness range (`6..24mm`) for sash glass.
- Hardware in demo includes exactly:
  - one lock item
  - one hinge set
- Cut-rule demo is intentionally minimal:
  - one frame rule
  - one sash rule
- Machining demo is intentionally minimal:
  - one lock-case pocket template.

## Verification path

- The test `src/renderer/src/domain/__tests__/mvp-demo-seed-scenario.test.js` proves:
  - compatibility validation
  - assembly tree generation
  - BOM generation
  - cut-rule calculation
  - machining operation generation
  - all in one end-to-end hinged-door scenario.
