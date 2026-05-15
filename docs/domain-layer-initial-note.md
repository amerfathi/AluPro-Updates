# Initial Domain Layer Notes

## Scope Applied

- Implemented initial domain model only.
- No UI changes.
- No rendering pipeline changes.
- No DB/schema changes.
- No full integration into existing compilers yet.

## Assumptions

1. Existing `profile` objects remain the source for runtime behavior until phased integration starts.
2. Domain layer uses adapters from legacy profile shape instead of replacing current `utils/*` logic.
3. Profile geometry is domain data only and must not carry preview/render assets.
4. Compatibility is represented with explicit `CompatibilityRule` objects and evaluated via rule context.
5. Default compatibility rules are conservative and can be extended per family during next phases.

## Why This Is Safe

- New files are additive and isolated under `src/renderer/src/domain`.
- No existing imports were changed in UI or production utilities.
- Tests validate domain invariants without touching production screens.
