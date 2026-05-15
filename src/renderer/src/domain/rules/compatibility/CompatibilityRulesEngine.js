import { asArray } from '../../shared/guards.js'
import {
  CompatibilityConstraintRule,
  compatibilityRuleTargets
} from './CompatibilityConstraintRule.js'

const normalizeRule = (entry, index) =>
  entry instanceof CompatibilityConstraintRule
    ? entry
    : new CompatibilityConstraintRule({
        id: entry?.id || `compatibility-rule-${index + 1}`,
        ...entry
      })

const getSubjectsForTarget = (target, context) => {
  if (target === 'system') return context?.system ? [context.system] : []
  if (target === 'glass') return asArray(context?.glassItems)
  if (target === 'accessory') return asArray(context?.accessoryItems)
  if (target === 'hardware') return asArray(context?.hardwareItems)
  return []
}

export class CompatibilityRulesEngine {
  constructor({ rules = [] } = {}) {
    this.rules = Object.freeze(
      asArray(rules)
        .map(normalizeRule)
        .sort((left, right) => left.priority - right.priority)
    )
    Object.freeze(this)
  }

  validate(context = {}) {
    const issues = []

    this.rules.forEach((rule) => {
      if (!compatibilityRuleTargets.includes(rule.target)) return
      const subjects = getSubjectsForTarget(rule.target, context)
      subjects.forEach((subject) => {
        const result = rule.evaluate(subject, context)
        if (result.matched && !result.valid) {
          issues.push(...result.issues)
        }
      })
    })

    return {
      issues,
      errors: issues.filter((issue) => issue.severity === 'error'),
      warnings: issues.filter((issue) => issue.severity === 'warning'),
      hasErrors: issues.some((issue) => issue.severity === 'error'),
      hasWarnings: issues.some((issue) => issue.severity === 'warning')
    }
  }
}
