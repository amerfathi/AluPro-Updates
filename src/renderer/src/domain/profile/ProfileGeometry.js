import { assertNonEmptyString, assertNonNegativeNumber, asArray } from '../shared/guards.js'
import { DomainValidationError } from '../shared/DomainValidationError.js'
import { InterfaceDefinition } from './InterfaceDefinition.js'
import { SemanticZone } from './SemanticZone.js'

const FORBIDDEN_RENDER_FIELDS = Object.freeze([
  'preview',
  'previewAsset',
  'thumbnail',
  'icon',
  'sprite',
  'renderModel',
  'mesh'
])

export class ProfileGeometry {
  constructor({
    id,
    zones = [],
    interfaces = [],
    depthMm = 0,
    wallThicknessMm = 0,
    metadata = {},
    ...rest
  }) {
    this.id = assertNonEmptyString(id, 'geometry.id')

    // Assumption: geometry is domain-only data and must not contain rendering assets.
    const forbiddenFound = FORBIDDEN_RENDER_FIELDS.find(
      (fieldName) => fieldName in rest || fieldName in metadata
    )
    if (forbiddenFound) {
      throw new DomainValidationError(
        `Geometry cannot include rendering field: ${forbiddenFound}`,
        { fieldName: forbiddenFound }
      )
    }

    const normalizedZones = asArray(zones).map((zone) => SemanticZone.from(zone))
    const dedupedZones = new Map(normalizedZones.map((zone) => [zone.id, zone]))

    if (dedupedZones.size === 0) {
      throw new DomainValidationError('geometry.zones must contain at least one semantic zone', {
        geometryId: this.id
      })
    }

    this.zones = Object.freeze(Array.from(dedupedZones.values()))
    this.interfaces = Object.freeze(
      asArray(interfaces).map((entry, index) =>
        entry instanceof InterfaceDefinition
          ? entry
          : new InterfaceDefinition({
              id: entry?.id || `${this.id}-if-${index + 1}`,
              ...entry
            })
      )
    )
    this.depthMm = assertNonNegativeNumber(depthMm, 'geometry.depthMm', 0)
    this.wallThicknessMm = assertNonNegativeNumber(wallThicknessMm, 'geometry.wallThicknessMm', 0)
    this.metadata = Object.freeze({ ...(metadata || {}) })

    Object.freeze(this)
  }

  hasZone(zoneId) {
    const zone = SemanticZone.from(zoneId)
    return this.zones.some((currentZone) => currentZone.equals(zone))
  }

  getInterfacesForZone(zoneId) {
    const zone = SemanticZone.from(zoneId)
    return this.interfaces.filter((entry) => entry.includesZone(zone))
  }

  toJSON() {
    return {
      id: this.id,
      zones: this.zones.map((zone) => zone.id),
      interfaces: this.interfaces.map((entry) => entry.toJSON()),
      depthMm: this.depthMm,
      wallThicknessMm: this.wallThicknessMm,
      metadata: { ...this.metadata }
    }
  }
}
