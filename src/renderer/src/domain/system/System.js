import { Accessory } from '../materials/Accessory.js'
import { ProfileFamily } from '../profile/ProfileFamily.js'
import { ProfileVariant } from '../profile/ProfileVariant.js'
import { CompatibilityRule } from '../rules/CompatibilityRule.js'
import { assertNonEmptyString, asArray } from '../shared/guards.js'
import { DomainValidationError } from '../shared/DomainValidationError.js'

export class System {
  constructor({ id, name, family, variants = [], compatibilityRules = [], metadata = {} }) {
    this.id = assertNonEmptyString(String(id), 'system.id')
    this.name = assertNonEmptyString(name, 'system.name')
    this.family = ProfileFamily.from(family)

    const normalizedVariants = asArray(variants)
    if (normalizedVariants.length === 0) {
      throw new DomainValidationError('system.variants must include at least one profile variant', {
        systemId: this.id
      })
    }

    this.variants = Object.freeze(
      normalizedVariants.map((entry) => {
        if (!(entry instanceof ProfileVariant)) {
          throw new DomainValidationError('system.variants must contain ProfileVariant instances', {
            systemId: this.id
          })
        }
        return entry
      })
    )

    this.compatibilityRules = Object.freeze(
      asArray(compatibilityRules)
        .map((entry, index) =>
          entry instanceof CompatibilityRule
            ? entry
            : new CompatibilityRule({
                id: entry?.id || `${this.id}-rule-${index + 1}`,
                ...entry
              })
        )
        .sort((left, right) => left.priority - right.priority)
    )
    this.metadata = Object.freeze({ ...(metadata || {}) })

    Object.freeze(this)
  }

  getVariantById(variantId) {
    const id = String(variantId)
    return this.variants.find((variant) => variant.id === id) || null
  }

  evaluateAccessoryCompatibility({ variantId, accessory, sectionType = 'all', zoneId = null }) {
    const variant = this.getVariantById(variantId)
    if (!variant) {
      return {
        allowed: false,
        reason: `Unknown variant: ${variantId}`,
        matchedRule: null
      }
    }

    const runtimeAccessory = Accessory.from(accessory, `${this.id}-runtime-accessory`)
    const context = {
      systemId: this.id,
      profileFamily: variant.family.id,
      variantId: variant.id,
      accessoryId: runtimeAccessory.id,
      sectionType,
      zoneId
    }

    for (const rule of this.compatibilityRules) {
      const result = rule.evaluate(context)
      if (result.matched) {
        return {
          allowed: result.allowed,
          reason: result.message || (result.allowed ? 'Allowed by rule' : 'Denied by rule'),
          matchedRule: rule.id
        }
      }
    }

    const supported = variant.supportsAccessory(runtimeAccessory, { sectionType, zoneId })
    return {
      allowed: supported,
      reason: supported ? 'Allowed by variant constraints' : 'Denied by variant constraints',
      matchedRule: null
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      family: this.family.toJSON(),
      variants: this.variants.map((variant) => variant.toJSON()),
      compatibilityRules: this.compatibilityRules.map((rule) => rule.toJSON()),
      metadata: { ...this.metadata }
    }
  }
}
