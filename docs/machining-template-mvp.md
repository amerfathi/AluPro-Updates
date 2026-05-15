# Machining Template MVP Note

## Scope
This MVP introduces explicit machining templates without changing UI structure, CNC export, or database schema.

## Assumptions
- Machining operations are derived from domain assembly/BOM data, not direct UI state.
- Accessories and profile roles can both imply machining.
- Initial formulas are lightweight and reference element/section metrics in millimeters.
- Machining operations are informational/planning-level records for now (cost defaults to `0`).

## Current Structure
- `src/renderer/src/domain/machining/MachiningTemplate.js`
  - Defines explicit template shape: target match, section filters, reference anchors, offsets, quantity model, hole pattern.
- `src/renderer/src/domain/machining/defaultMachiningTemplates.js`
  - Provides baseline templates (lock case, hinge holes, handle spindle, sash drain slots).
- `src/renderer/src/domain/machining/generateMachiningOperations.js`
  - Resolves template matches against BOM profile/accessory rows.
  - Computes reference points with anchor + formula offsets.
  - Emits normalized workshop operation entries with `category: machining`.

## Integration Point
- `compileTechnicalSystemWindow` now:
  1. builds `assemblyTree`
  2. generates BOM from assembly
  3. generates `machiningOperations` from BOM + tree
  4. appends machining operations into legacy `operations` output for compatibility

## Future Export Considerations
- Add operation-to-machine mapping (`machineCode`, `toolCode`, spindle/feed hints).
- Introduce operation grouping per section/sash for deterministic CNC job ordering.
- Add coordinate system strategy (profile-local vs element-global).
- Add post-process adapters (DXF/CNC vendor formats) in a separate export layer.
