import {
  asArray,
  assertNonEmptyString,
  assertNonNegativeNumber,
  assertOneOf
} from '../shared/guards.js'

export const cutRuleScopes = Object.freeze(['profile'])

export const cutRuleBaseDimensions = Object.freeze([
  'element_width',
  'element_height',
  'section_width',
  'section_height',
  'role_auto'
])

export const cutJointAssumptions = Object.freeze([
  'auto',
  'miter_45_symmetric',
  'butt_joint_square',
  'mixed_joinery'
])

const normalizePriority = (value, fallback = 100) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const inferAutoBaseDimension = (physicalRole = '') => {
  const role = String(physicalRole || '').toLowerCase()
  if (role.startsWith('frame_')) return role.endsWith('_h') ? 'element_height' : 'element_width'
  if (role.startsWith('mullion_')) return role.endsWith('_h') ? 'element_height' : 'element_width'
  return role.endsWith('_h') ? 'section_height' : 'section_width'
}

const resolveContextValue = (context, baseDimension) => {
  if (baseDimension === 'element_width') return toNumber(context?.elementWidthM, 0)
  if (baseDimension === 'element_height') return toNumber(context?.elementHeightM, 0)
  if (baseDimension === 'section_width') return toNumber(context?.sectionWidthM, 0)
  if (baseDimension === 'section_height') return toNumber(context?.sectionHeightM, 0)
  return 0
}

export class CutRule {
  constructor({
    id,
    name,
    scope = 'profile',
    roleIds = [],
    rolePrefixes = [],
    baseDimension = 'role_auto',
    leftDeductionCm = 0,
    rightDeductionCm = 0,
    jointAssumption = 'auto',
    priority = 100,
    notes = ''
  }) {
    this.id = assertNonEmptyString(String(id), 'cutRule.id')
    this.name = assertNonEmptyString(name || id, 'cutRule.name')
    this.scope = assertOneOf(scope, cutRuleScopes, 'cutRule.scope')
    this.roleIds = Object.freeze(asArray(roleIds).map((role) => String(role || '').toLowerCase()))
    this.rolePrefixes = Object.freeze(
      asArray(rolePrefixes).map((role) => String(role || '').toLowerCase())
    )
    this.baseDimension = assertOneOf(baseDimension, cutRuleBaseDimensions, 'cutRule.baseDimension')
    this.leftDeductionCm = assertNonNegativeNumber(leftDeductionCm, 'cutRule.leftDeductionCm', 0)
    this.rightDeductionCm = assertNonNegativeNumber(rightDeductionCm, 'cutRule.rightDeductionCm', 0)
    this.jointAssumption = assertOneOf(
      jointAssumption,
      cutJointAssumptions,
      'cutRule.jointAssumption'
    )
    this.priority = normalizePriority(priority)
    this.notes = typeof notes === 'string' ? notes.trim() : ''

    Object.freeze(this)
  }

  matchesRole(physicalRole = '') {
    const role = String(physicalRole || '').trim().toLowerCase()
    if (!role) return false
    if (this.roleIds.length === 0 && this.rolePrefixes.length === 0) return true
    if (this.roleIds.includes(role)) return true
    return this.rolePrefixes.some((prefix) => role.startsWith(prefix))
  }

  resolveBaseDimension(physicalRole = '') {
    if (this.baseDimension !== 'role_auto') return this.baseDimension
    return inferAutoBaseDimension(physicalRole)
  }

  resolveBaseLength(context = {}) {
    const baseDimension = this.resolveBaseDimension(context.physicalRole)
    return resolveContextValue(context, baseDimension)
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      scope: this.scope,
      roleIds: [...this.roleIds],
      rolePrefixes: [...this.rolePrefixes],
      baseDimension: this.baseDimension,
      leftDeductionCm: this.leftDeductionCm,
      rightDeductionCm: this.rightDeductionCm,
      jointAssumption: this.jointAssumption,
      priority: this.priority,
      notes: this.notes
    }
  }
}
