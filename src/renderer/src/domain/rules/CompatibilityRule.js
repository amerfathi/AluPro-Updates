import { assertNonEmptyString, assertOneOf } from '../shared/guards.js'

export const compatibilityEffects = Object.freeze(['allow', 'deny'])
export const compatibilityScopes = Object.freeze([
  'profile-accessory',
  'profile-profile',
  'zone-interface',
  'system'
])

const valueMatches = (expected, actual) => {
  if (expected === undefined || expected === null || expected === '') return true
  if (Array.isArray(expected)) return expected.includes(actual)
  return expected === actual
}

const contextMatches = (conditions = {}, context = {}) =>
  Object.entries(conditions).every(([key, expected]) => valueMatches(expected, context[key]))

export class CompatibilityRule {
  constructor({
    id,
    name,
    scope = 'profile-accessory',
    effect = 'allow',
    priority = 100,
    conditions = {},
    message = ''
  }) {
    this.id = assertNonEmptyString(id, 'compatibilityRule.id')
    this.name = assertNonEmptyString(name || id, 'compatibilityRule.name')
    this.scope = assertOneOf(scope, compatibilityScopes, 'compatibilityRule.scope')
    this.effect = assertOneOf(effect, compatibilityEffects, 'compatibilityRule.effect')
    this.priority = Number.isFinite(Number(priority)) ? Number(priority) : 100
    this.conditions = Object.freeze({ ...(conditions || {}) })
    this.message = typeof message === 'string' ? message.trim() : ''

    Object.freeze(this)
  }

  evaluate(context = {}) {
    const matched = contextMatches(this.conditions, context)
    if (!matched) {
      return {
        matched: false,
        allowed: true,
        ruleId: this.id,
        effect: this.effect
      }
    }

    return {
      matched: true,
      allowed: this.effect === 'allow',
      ruleId: this.id,
      effect: this.effect,
      message: this.message
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      scope: this.scope,
      effect: this.effect,
      priority: this.priority,
      conditions: { ...this.conditions },
      message: this.message
    }
  }
}
