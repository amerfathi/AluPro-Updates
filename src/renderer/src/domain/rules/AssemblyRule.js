import { asArray, assertNonEmptyString, assertOneOf } from '../shared/guards.js'

export const assemblyRuleSources = Object.freeze([
  'structuredFormulas',
  'glassFormulas',
  'accessories'
])

export const assemblyRuleAttachTargets = Object.freeze([
  'root',
  'frame',
  'section',
  'sash',
  'fixed_panel'
])

const normalizeMatch = (match = {}) =>
  Object.freeze({
    physicalRoles: Object.freeze(asArray(match.physicalRoles).filter(Boolean)),
    physicalRolePrefixes: Object.freeze(asArray(match.physicalRolePrefixes).filter(Boolean)),
    accessoryKinds: Object.freeze(asArray(match.accessoryKinds).filter(Boolean)),
    accessorySectionTypes: Object.freeze(asArray(match.accessorySectionTypes).filter(Boolean)),
    sectionTypes: Object.freeze(asArray(match.sectionTypes).filter(Boolean))
  })

const listMatches = (expected, actual) => expected.length === 0 || expected.includes(actual)

const roleMatches = (ruleMatch, role = '') => {
  if (ruleMatch.physicalRoles.length === 0 && ruleMatch.physicalRolePrefixes.length === 0)
    return true
  if (ruleMatch.physicalRoles.includes(role)) return true
  return ruleMatch.physicalRolePrefixes.some((prefix) => role.startsWith(prefix))
}

const normalizePriority = (value, fallback = 100) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export class AssemblyRule {
  constructor({
    id,
    name,
    source,
    nodeType,
    attachTo = 'root',
    priority = 100,
    description = '',
    match = {}
  }) {
    this.id = assertNonEmptyString(String(id), 'assemblyRule.id')
    this.name = assertNonEmptyString(name || id, 'assemblyRule.name')
    this.source = assertOneOf(source, assemblyRuleSources, 'assemblyRule.source')
    this.nodeType = assertNonEmptyString(nodeType, 'assemblyRule.nodeType')
    this.attachTo = assertOneOf(attachTo, assemblyRuleAttachTargets, 'assemblyRule.attachTo')
    this.priority = normalizePriority(priority)
    this.description = typeof description === 'string' ? description.trim() : ''
    this.match = normalizeMatch(match)

    Object.freeze(this)
  }

  matchesEntry(entry, context = {}) {
    if (!entry) return false

    if (this.source !== 'accessories') {
      const role = entry.physicalRole || ''
      if (!roleMatches(this.match, role)) return false
    }

    if (this.source === 'accessories') {
      if (!listMatches(this.match.accessoryKinds, context.accessoryKind)) return false
      if (
        !listMatches(this.match.accessorySectionTypes, entry.sectionType || 'all') &&
        !listMatches(this.match.accessorySectionTypes, context.targetSectionType || 'all')
      ) {
        return false
      }
    }

    if (!listMatches(this.match.sectionTypes, context.targetSectionType || 'all')) return false
    return true
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      source: this.source,
      nodeType: this.nodeType,
      attachTo: this.attachTo,
      priority: this.priority,
      description: this.description,
      match: {
        physicalRoles: [...this.match.physicalRoles],
        physicalRolePrefixes: [...this.match.physicalRolePrefixes],
        accessoryKinds: [...this.match.accessoryKinds],
        accessorySectionTypes: [...this.match.accessorySectionTypes],
        sectionTypes: [...this.match.sectionTypes]
      }
    }
  }
}
