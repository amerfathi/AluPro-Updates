import { describe, expect, it } from 'vitest'
import { compileTechnicalSystemWindow } from '../../utils/technicalSystem.js'
import { createDefaultProfileCutRules } from '../rules/fixtures/defaultCutRules.js'
import { ProfileCutRulesEngine } from '../rules/cutting/ProfileCutRulesEngine.js'

describe('Profile cut rules engine (MVP)', () => {
  it('calculates frame and sash cuts with explicit left/right deductions', () => {
    const engine = new ProfileCutRulesEngine(
      createDefaultProfileCutRules({
        frameDedW: 5,
        frameDedH: 5,
        sashDedW: 10,
        sashDedH: 10
      })
    )

    const frameWidthCut = engine.calculateProfileCut({
      physicalRole: 'frame_w',
      formula: { divideBy: 1, offsetCm: 0, cutType: '45' },
      elementWidthM: 1.2,
      elementHeightM: 2.2,
      sectionWidthM: 1.2,
      sectionHeightM: 2.2
    })
    expect(frameWidthCut.finalLengthM).toBeCloseTo(1.2, 6)
    expect(frameWidthCut.leftDeductionCm).toBe(0)
    expect(frameWidthCut.rightDeductionCm).toBe(0)
    expect(frameWidthCut.jointAssumption).toBe('miter_45_symmetric')

    const sashWidthCut = engine.calculateProfileCut({
      physicalRole: 'sash_w',
      formula: { divideBy: 1, offsetCm: 0, cutType: '45' },
      elementWidthM: 1.0,
      elementHeightM: 2.2,
      sectionWidthM: 1.0,
      sectionHeightM: 2.2
    })
    expect(sashWidthCut.finalLengthM).toBeCloseTo(0.95, 6)
    expect(sashWidthCut.leftDeductionCm).toBeCloseTo(2.5, 6)
    expect(sashWidthCut.rightDeductionCm).toBeCloseTo(2.5, 6)
    expect(sashWidthCut.totalDeductionCm).toBeCloseTo(5, 6)
  })

  it('handles bead and mullion examples with realistic dimensions and join assumptions', () => {
    const engine = new ProfileCutRulesEngine(
      createDefaultProfileCutRules({
        frameDedW: 5,
        frameDedH: 5,
        sashDedW: 10,
        sashDedH: 10
      })
    )

    const beadSashHeightCut = engine.calculateProfileCut({
      physicalRole: 'bead_sash_h',
      formula: { divideBy: 1, offsetCm: 0, cutType: '45' },
      elementWidthM: 1.0,
      elementHeightM: 1.5,
      sectionWidthM: 1.0,
      sectionHeightM: 1.5
    })
    expect(beadSashHeightCut.finalLengthM).toBeCloseTo(1.35, 6)
    expect(beadSashHeightCut.leftDeductionCm).toBeCloseTo(7.5, 6)
    expect(beadSashHeightCut.rightDeductionCm).toBeCloseTo(7.5, 6)

    const mullionHeightCut = engine.calculateProfileCut({
      physicalRole: 'mullion_h',
      formula: { divideBy: 1, offsetCm: 0, cutType: '90' },
      elementWidthM: 1.5,
      elementHeightM: 2.2,
      sectionWidthM: 1.5,
      sectionHeightM: 2.2
    })
    expect(mullionHeightCut.finalLengthM).toBeCloseTo(2.15, 6)
    expect(mullionHeightCut.jointAssumption).toBe('butt_joint_square')
  })
})

describe('Cut rules integration with compileTechnicalSystemWindow', () => {
  it('adds explicit cut-rule metadata to generated profile pieces', () => {
    const system = {
      id: 'sys-cut-integration-1',
      name: 'Cut Integration System',
      systemType: 'casement',
      miterWasteCm: 6.5,
      mullionThicknessCm: 4,
      physics: {
        frameDedW: 5,
        frameDedH: 5,
        sashDedW: 10,
        sashDedH: 10
      },
      structuredFormulas: [
        {
          id: 'f-1',
          label: 'Frame width',
          qty: 2,
          cutType: '45',
          inventoryId: 'alu-frame',
          physicalRole: 'frame_w',
          divideBy: 1,
          offsetCm: 0
        },
        {
          id: 's-1',
          label: 'Sash width',
          qty: 2,
          cutType: '45',
          inventoryId: 'alu-sash',
          physicalRole: 'sash_w',
          divideBy: 1,
          offsetCm: 0
        }
      ],
      glassFormulas: [],
      accessories: [],
      workshopOperations: []
    }

    const opening = {
      id: 'open-cut-1',
      label: 'Door C',
      width: '1.00',
      height: '2.20',
      quantity: '1',
      isComplex: false,
      sections: [{ id: 1, type: 'sash', h: '' }]
    }

    const compiled = compileTechnicalSystemWindow({ system, opening })
    expect(compiled.errors).toHaveLength(0)

    const framePiece = compiled.pieces.find((piece) => piece.physicalRole === 'frame_w')
    const sashPiece = compiled.pieces.find((piece) => piece.physicalRole === 'sash_w')

    expect(framePiece).toBeTruthy()
    expect(framePiece.length).toBeCloseTo(1.0, 6)
    expect(framePiece.cutRuleId).toBe('cut-frame-width')
    expect(framePiece.jointAssumption).toBe('miter_45_symmetric')
    expect(framePiece.deductionsCm).toEqual({ left: 0, right: 0 })

    expect(sashPiece).toBeTruthy()
    expect(sashPiece.length).toBeCloseTo(0.95, 6)
    expect(sashPiece.cutRuleId).toBe('cut-sash-width')
    expect(sashPiece.deductionsCm.left).toBeCloseTo(2.5, 6)
    expect(sashPiece.deductionsCm.right).toBeCloseTo(2.5, 6)

    const profileBomRows = compiled.bomItems.filter((item) => item.kind === 'profile')
    expect(profileBomRows.length).toBeGreaterThan(0)
    expect(profileBomRows[0].metadata.cutRuleId).toBeTruthy()
  })
})
