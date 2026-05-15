import { asArray } from '../../shared/guards.js'
import { CutRule } from '../CutRule.js'

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const round3 = (value) => Number(toNumber(value, 0).toFixed(3))

const normalizeCutType = (value) => (String(value || '90') === '45' ? '45' : '90')

const resolveJointAssumption = (cutType, fallback = 'auto') => {
  if (normalizeCutType(cutType) === '45') return 'miter_45_symmetric'
  if (normalizeCutType(cutType) === '90') return 'butt_joint_square'
  return fallback
}

const createFallbackRule = () =>
  new CutRule({
    id: 'fallback-profile-cut-rule',
    name: 'Fallback profile cut rule',
    rolePrefixes: [''],
    baseDimension: 'role_auto',
    leftDeductionCm: 0,
    rightDeductionCm: 0,
    jointAssumption: 'auto',
    priority: Number.MAX_SAFE_INTEGER
  })

export class ProfileCutRulesEngine {
  constructor(rules = []) {
    this.rules = Object.freeze(
      asArray(rules)
        .map((rule, index) =>
          rule instanceof CutRule
            ? rule
            : new CutRule({
                id: rule?.id || `profile-cut-rule-${index + 1}`,
                ...rule
              })
        )
        .sort((left, right) => left.priority - right.priority)
    )
    this.fallbackRule = createFallbackRule()
    Object.freeze(this)
  }

  resolveRuleForRole(physicalRole = '') {
    return this.rules.find((rule) => rule.matchesRole(physicalRole)) || this.fallbackRule
  }

  calculateProfileCut({
    physicalRole,
    formula = {},
    elementWidthM = 0,
    elementHeightM = 0,
    sectionWidthM = 0,
    sectionHeightM = 0,
    forceSingle = false
  }) {
    const role = String(physicalRole || '').trim().toLowerCase()
    if (!role) return null

    const rule = this.resolveRuleForRole(role)
    const context = {
      physicalRole: role,
      elementWidthM: toNumber(elementWidthM, 0),
      elementHeightM: toNumber(elementHeightM, 0),
      sectionWidthM: toNumber(sectionWidthM, toNumber(elementWidthM, 0)),
      sectionHeightM: toNumber(sectionHeightM, toNumber(elementHeightM, 0))
    }

    const baseLengthM = toNumber(rule.resolveBaseLength(context), 0)
    if (baseLengthM <= 0) return null

    const divideBy = forceSingle ? 1 : Math.max(1, Math.floor(toNumber(formula.divideBy, 1)))
    const dividedLengthM = baseLengthM / divideBy
    const leftDeductionCm = toNumber(rule.leftDeductionCm, 0)
    const rightDeductionCm = toNumber(rule.rightDeductionCm, 0)
    const totalDeductionM = (leftDeductionCm + rightDeductionCm) / 100
    const offsetM = toNumber(formula.offsetCm, 0) / 100
    const finalLengthM = round3(dividedLengthM - totalDeductionM + offsetM)

    if (finalLengthM <= 0) return null

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      baseDimension: rule.resolveBaseDimension(role),
      baseLengthM: round3(baseLengthM),
      dividedLengthM: round3(dividedLengthM),
      leftDeductionCm: round3(leftDeductionCm),
      rightDeductionCm: round3(rightDeductionCm),
      totalDeductionCm: round3(leftDeductionCm + rightDeductionCm),
      offsetCm: round3(toNumber(formula.offsetCm, 0)),
      jointAssumption: resolveJointAssumption(formula.cutType, rule.jointAssumption),
      cutType: normalizeCutType(formula.cutType),
      finalLengthM
    }
  }
}
