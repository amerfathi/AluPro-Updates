import { asArray, assertNonEmptyString, assertOneOf } from '../../shared/guards.js'

export const compatibilityRuleSeverities = Object.freeze(['error', 'warning'])
export const compatibilityRuleTargets = Object.freeze(['system', 'glass', 'accessory', 'hardware'])
export const compatibilityAssertionOperators = Object.freeze([
  'equals',
  'notEquals',
  'in',
  'notIn',
  'between',
  'arrayEveryBetween',
  'truthy',
  'inFieldArray'
])

const normalizePriority = (value, fallback = 100) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const resolveField = (subject, globalContext, field) => {
  if (!field || typeof field !== 'string') return undefined
  const segments = field.split('.')
  const readPath = (source) =>
    segments.reduce(
      (current, segment) => (current === undefined ? undefined : current?.[segment]),
      source
    )

  const localValue = readPath(subject)
  if (localValue !== undefined) return localValue
  return readPath(globalContext)
}

const valueMatches = (expected, actual) => {
  if (expected === undefined || expected === null || expected === '') return true
  if (Array.isArray(expected)) return expected.includes(actual)
  return expected === actual
}

const conditionsMatch = (conditions = {}, subject = {}, globalContext = {}) =>
  Object.entries(conditions).every(([field, expected]) =>
    valueMatches(expected, resolveField(subject, globalContext, field))
  )

const evaluateAssertion = (assertion, subject, globalContext) => {
  const actual = resolveField(subject, globalContext, assertion.field)

  switch (assertion.operator) {
    case 'equals':
      return actual === assertion.value
    case 'notEquals':
      return actual !== assertion.value
    case 'in':
      return asArray(assertion.value).includes(actual)
    case 'notIn':
      return !asArray(assertion.value).includes(actual)
    case 'between': {
      const numeric = Number(actual)
      if (!Number.isFinite(numeric)) return false
      return numeric >= Number(assertion.min) && numeric <= Number(assertion.max)
    }
    case 'arrayEveryBetween': {
      const values = asArray(actual)
      if (values.length === 0) return false
      return values.every((entry) => {
        const numeric = Number(entry)
        return (
          Number.isFinite(numeric) &&
          numeric >= Number(assertion.min) &&
          numeric <= Number(assertion.max)
        )
      })
    }
    case 'truthy':
      return Boolean(actual)
    case 'inFieldArray': {
      const options = asArray(resolveField(subject, globalContext, assertion.fieldRef))
      return options.includes(actual)
    }
    default:
      return true
  }
}

const normalizeAssertion = (assertion, index, ruleId) => {
  const operator = assertOneOf(
    assertion?.operator || 'equals',
    compatibilityAssertionOperators,
    `compatibilityRule.assertions[${index}].operator`
  )

  return Object.freeze({
    id: assertion?.id || `${ruleId}-assertion-${index + 1}`,
    field: assertNonEmptyString(
      assertion?.field || '',
      `compatibilityRule.assertions[${index}].field`
    ),
    operator,
    value: assertion?.value,
    min: assertion?.min,
    max: assertion?.max,
    fieldRef: assertion?.fieldRef,
    message: typeof assertion?.message === 'string' ? assertion.message.trim() : ''
  })
}

export class CompatibilityConstraintRule {
  constructor({
    id,
    name,
    target = 'system',
    severity = 'error',
    priority = 100,
    when = {},
    assertions = [],
    message = ''
  }) {
    this.id = assertNonEmptyString(String(id), 'compatibilityRule.id')
    this.name = assertNonEmptyString(name || id, 'compatibilityRule.name')
    this.target = assertOneOf(target, compatibilityRuleTargets, 'compatibilityRule.target')
    this.severity = assertOneOf(severity, compatibilityRuleSeverities, 'compatibilityRule.severity')
    this.priority = normalizePriority(priority)
    this.when = Object.freeze({ ...(when || {}) })
    this.assertions = Object.freeze(
      asArray(assertions).map((assertion, index) => normalizeAssertion(assertion, index, this.id))
    )
    this.message = typeof message === 'string' ? message.trim() : ''

    Object.freeze(this)
  }

  evaluate(subject = {}, globalContext = {}) {
    const matched = conditionsMatch(this.when, subject, globalContext)
    if (!matched) {
      return {
        matched: false,
        valid: true,
        issues: []
      }
    }

    const failedAssertions = this.assertions.filter(
      (assertion) => !evaluateAssertion(assertion, subject, globalContext)
    )

    if (failedAssertions.length === 0) {
      return {
        matched: true,
        valid: true,
        issues: []
      }
    }

    return {
      matched: true,
      valid: false,
      issues: failedAssertions.map((assertion) => ({
        ruleId: this.id,
        ruleName: this.name,
        target: this.target,
        severity: this.severity,
        message: assertion.message || this.message || `Compatibility rule failed: ${this.name}`,
        assertionId: assertion.id,
        subjectId: subject?.id || null
      }))
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      target: this.target,
      severity: this.severity,
      priority: this.priority,
      when: { ...this.when },
      assertions: this.assertions.map((assertion) => ({ ...assertion })),
      message: this.message
    }
  }
}
