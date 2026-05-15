import { DomainValidationError } from '../shared/DomainValidationError.js'
import { assertNonEmptyString } from '../shared/guards.js'

const ZONE_CATALOG = Object.freeze({
  frame_w: Object.freeze({
    id: 'frame_w',
    component: 'frame',
    axis: 'width',
    sectionType: 'all'
  }),
  frame_h: Object.freeze({
    id: 'frame_h',
    component: 'frame',
    axis: 'height',
    sectionType: 'all'
  }),
  mullion_w: Object.freeze({
    id: 'mullion_w',
    component: 'mullion',
    axis: 'width',
    sectionType: 'all'
  }),
  mullion_h: Object.freeze({
    id: 'mullion_h',
    component: 'mullion',
    axis: 'height',
    sectionType: 'all'
  }),
  sash_w: Object.freeze({
    id: 'sash_w',
    component: 'sash',
    axis: 'width',
    sectionType: 'sash'
  }),
  sash_h: Object.freeze({
    id: 'sash_h',
    component: 'sash',
    axis: 'height',
    sectionType: 'sash'
  }),
  bead_fixed_w: Object.freeze({
    id: 'bead_fixed_w',
    component: 'bead',
    axis: 'width',
    sectionType: 'fixed'
  }),
  bead_fixed_h: Object.freeze({
    id: 'bead_fixed_h',
    component: 'bead',
    axis: 'height',
    sectionType: 'fixed'
  }),
  bead_sash_w: Object.freeze({
    id: 'bead_sash_w',
    component: 'bead',
    axis: 'width',
    sectionType: 'sash'
  }),
  bead_sash_h: Object.freeze({
    id: 'bead_sash_h',
    component: 'bead',
    axis: 'height',
    sectionType: 'sash'
  }),
  glass_fixed: Object.freeze({
    id: 'glass_fixed',
    component: 'glass',
    axis: 'area',
    sectionType: 'fixed'
  }),
  glass_sash: Object.freeze({
    id: 'glass_sash',
    component: 'glass',
    axis: 'area',
    sectionType: 'sash'
  })
})

export const semanticZoneCatalog = ZONE_CATALOG
export const semanticZoneIds = Object.freeze(Object.keys(ZONE_CATALOG))

export class SemanticZone {
  constructor(zoneId) {
    const normalizedZoneId = assertNonEmptyString(zoneId, 'zoneId')
    const definition = ZONE_CATALOG[normalizedZoneId]
    if (!definition) {
      throw new DomainValidationError(`Unknown semantic zone: ${normalizedZoneId}`, {
        zoneId: normalizedZoneId
      })
    }

    this.id = definition.id
    this.component = definition.component
    this.axis = definition.axis
    this.sectionType = definition.sectionType

    Object.freeze(this)
  }

  matchesSectionType(sectionType = 'all') {
    if (sectionType === 'all') return true
    return this.sectionType === 'all' || this.sectionType === sectionType
  }

  equals(otherZone) {
    return otherZone instanceof SemanticZone && otherZone.id === this.id
  }

  toJSON() {
    return {
      id: this.id,
      component: this.component,
      axis: this.axis,
      sectionType: this.sectionType
    }
  }

  static from(zone) {
    if (zone instanceof SemanticZone) return zone
    return new SemanticZone(zone)
  }
}
