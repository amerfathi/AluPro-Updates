# Cut Rules MVP (Profiles)

## Scope

- Implemented the first domain-level cut rule model for profile pieces.
- No optimization engine changes.
- No CNC export in this step.

## Domain Design

- `CutRule` now represents:
  - matching roles (e.g. `frame_w`, `sash_h`)
  - base dimension source (`element_width`, `section_height`, etc.)
  - explicit left/right deductions in centimeters
  - joint assumption (`miter_45_symmetric`, `butt_joint_square`)
- `ProfileCutRulesEngine` evaluates a role + dimensions + formula and returns:
  - computed final cut length
  - deduction breakdown
  - applied rule id
  - resolved joint assumption

## Integration

- BOM profile rows are now produced through cut rules logic (domain path), not ad-hoc UI/controller math.
- Existing output compatibility is preserved:
  - `pieces` still returned for production preparation.
  - additional metadata is appended (`cutRuleId`, deductions, joint assumption).

## Known MVP Limitations

- Focused on profile cuts only (frame/sash/mullion/beads).
- Glass and accessory calculations remain on their current MVP logic.
- Rule set is default/system-physics based; per-system authored cut templates are a later step.
