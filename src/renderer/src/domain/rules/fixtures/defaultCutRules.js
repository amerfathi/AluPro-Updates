import { CutRule } from '../CutRule.js'

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const half = (value) => Number((toNumber(value, 0) / 2).toFixed(3))

export const createDefaultProfileCutRules = (physics = {}) => {
  const frameDedW = toNumber(physics.frameDedW, 5)
  const frameDedH = toNumber(physics.frameDedH, 5)
  const sashDedW = toNumber(physics.sashDedW, 12)
  const sashDedH = toNumber(physics.sashDedH, 12)

  return [
    new CutRule({
      id: 'cut-frame-width',
      name: 'Frame width cut',
      roleIds: ['frame_w'],
      baseDimension: 'element_width',
      leftDeductionCm: 0,
      rightDeductionCm: 0,
      jointAssumption: 'miter_45_symmetric',
      priority: 10,
      notes: 'Frame width is cut from total element width with no side deduction in MVP.'
    }),
    new CutRule({
      id: 'cut-frame-height',
      name: 'Frame height cut',
      roleIds: ['frame_h'],
      baseDimension: 'element_height',
      leftDeductionCm: 0,
      rightDeductionCm: 0,
      jointAssumption: 'miter_45_symmetric',
      priority: 11
    }),
    new CutRule({
      id: 'cut-mullion-width',
      name: 'Mullion width cut',
      roleIds: ['mullion_w'],
      baseDimension: 'element_width',
      leftDeductionCm: half(frameDedW),
      rightDeductionCm: half(frameDedW),
      jointAssumption: 'butt_joint_square',
      priority: 20
    }),
    new CutRule({
      id: 'cut-mullion-height',
      name: 'Mullion height cut',
      roleIds: ['mullion_h'],
      baseDimension: 'element_height',
      leftDeductionCm: half(frameDedH),
      rightDeductionCm: half(frameDedH),
      jointAssumption: 'butt_joint_square',
      priority: 21
    }),
    new CutRule({
      id: 'cut-sash-width',
      name: 'Sash width cut',
      roleIds: ['sash_w'],
      baseDimension: 'section_width',
      leftDeductionCm: half(frameDedW),
      rightDeductionCm: half(frameDedW),
      jointAssumption: 'miter_45_symmetric',
      priority: 30
    }),
    new CutRule({
      id: 'cut-sash-height',
      name: 'Sash height cut',
      roleIds: ['sash_h'],
      baseDimension: 'section_height',
      leftDeductionCm: half(frameDedH),
      rightDeductionCm: half(frameDedH),
      jointAssumption: 'miter_45_symmetric',
      priority: 31
    }),
    new CutRule({
      id: 'cut-bead-fixed-width',
      name: 'Fixed bead width cut',
      roleIds: ['bead_fixed_w'],
      baseDimension: 'section_width',
      leftDeductionCm: half(frameDedW),
      rightDeductionCm: half(frameDedW),
      jointAssumption: 'miter_45_symmetric',
      priority: 40
    }),
    new CutRule({
      id: 'cut-bead-fixed-height',
      name: 'Fixed bead height cut',
      roleIds: ['bead_fixed_h'],
      baseDimension: 'section_height',
      leftDeductionCm: half(frameDedH),
      rightDeductionCm: half(frameDedH),
      jointAssumption: 'miter_45_symmetric',
      priority: 41
    }),
    new CutRule({
      id: 'cut-bead-sash-width',
      name: 'Sash bead width cut',
      roleIds: ['bead_sash_w'],
      baseDimension: 'section_width',
      leftDeductionCm: half(frameDedW + sashDedW),
      rightDeductionCm: half(frameDedW + sashDedW),
      jointAssumption: 'miter_45_symmetric',
      priority: 42
    }),
    new CutRule({
      id: 'cut-bead-sash-height',
      name: 'Sash bead height cut',
      roleIds: ['bead_sash_h'],
      baseDimension: 'section_height',
      leftDeductionCm: half(frameDedH + sashDedH),
      rightDeductionCm: half(frameDedH + sashDedH),
      jointAssumption: 'miter_45_symmetric',
      priority: 43
    })
  ]
}
