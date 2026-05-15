import { assertNonEmptyString, assertOneOf } from '../shared/guards.js'
import { SemanticZone } from './SemanticZone.js'

export const interfaceJoinTypes = Object.freeze([
  'clip',
  'screw',
  'gasket',
  'sliding-track',
  'hinge',
  'seal'
])

export class InterfaceDefinition {
  constructor({
    id,
    sourceZone,
    targetZone,
    joinType = 'clip',
    constraints = {},
    description = ''
  }) {
    this.id = assertNonEmptyString(id, 'interface.id')
    this.sourceZone = SemanticZone.from(sourceZone)
    this.targetZone = SemanticZone.from(targetZone)
    this.joinType = assertOneOf(joinType, interfaceJoinTypes, 'interface.joinType')
    this.constraints = { ...(constraints || {}) }
    this.description = typeof description === 'string' ? description.trim() : ''

    Object.freeze(this.constraints)
    Object.freeze(this)
  }

  includesZone(zoneId) {
    const normalized = SemanticZone.from(zoneId)
    return this.sourceZone.equals(normalized) || this.targetZone.equals(normalized)
  }

  isBetween(zoneA, zoneB) {
    const a = SemanticZone.from(zoneA)
    const b = SemanticZone.from(zoneB)
    return (
      (this.sourceZone.equals(a) && this.targetZone.equals(b)) ||
      (this.sourceZone.equals(b) && this.targetZone.equals(a))
    )
  }

  toJSON() {
    return {
      id: this.id,
      sourceZone: this.sourceZone.id,
      targetZone: this.targetZone.id,
      joinType: this.joinType,
      constraints: { ...this.constraints },
      description: this.description
    }
  }
}
