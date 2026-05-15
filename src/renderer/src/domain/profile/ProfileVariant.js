import { Accessory } from '../materials/Accessory.js'
import { assertNonEmptyString, assertNonNegativeNumber, asArray } from '../shared/guards.js'
import { DomainValidationError } from '../shared/DomainValidationError.js'
import { ProfileFamily } from './ProfileFamily.js'
import { ProfileGeometry } from './ProfileGeometry.js'

const normalizePhysics = (physics = {}) =>
  Object.freeze({
    frameDedW: assertNonNegativeNumber(physics.frameDedW, 'variant.physics.frameDedW', 0),
    frameDedH: assertNonNegativeNumber(physics.frameDedH, 'variant.physics.frameDedH', 0),
    sashDedW: assertNonNegativeNumber(physics.sashDedW, 'variant.physics.sashDedW', 0),
    sashDedH: assertNonNegativeNumber(physics.sashDedH, 'variant.physics.sashDedH', 0)
  })

export class ProfileVariant {
  constructor({
    id,
    name,
    family,
    geometry,
    physics = {},
    accessories = [],
    structuredFormulas = [],
    glassFormulas = [],
    workshopOperations = [],
    metadata = {},
    legacyProfile = null
  }) {
    this.id = assertNonEmptyString(String(id), 'variant.id')
    this.name = assertNonEmptyString(name, 'variant.name')
    this.family = ProfileFamily.from(family)

    if (!(geometry instanceof ProfileGeometry)) {
      throw new DomainValidationError('variant.geometry must be a ProfileGeometry instance', {
        variantId: this.id
      })
    }
    this.geometry = geometry

    this.physics = normalizePhysics(physics)
    this.accessories = Object.freeze(
      asArray(accessories).map((entry, index) =>
        entry instanceof Accessory ? entry : Accessory.from(entry, `${this.id}-acc-${index + 1}`)
      )
    )

    this.structuredFormulas = Object.freeze(
      asArray(structuredFormulas).map((item) => ({ ...item }))
    )
    this.glassFormulas = Object.freeze(asArray(glassFormulas).map((item) => ({ ...item })))
    this.workshopOperations = Object.freeze(
      asArray(workshopOperations).map((item) => ({ ...item }))
    )
    this.metadata = Object.freeze({ ...(metadata || {}) })
    this.legacyProfile = legacyProfile ? Object.freeze({ ...legacyProfile }) : null

    Object.freeze(this)
  }

  supportsAccessory(accessory, { sectionType = 'all', zoneId = null } = {}) {
    const normalizedAccessory = Accessory.from(accessory, `${this.id}-runtime-accessory`)
    if (!normalizedAccessory.supportsSection(sectionType)) return false
    if (zoneId && !normalizedAccessory.supportsZone(zoneId)) return false
    if (zoneId && !this.geometry.hasZone(zoneId)) return false
    return true
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      family: this.family.toJSON(),
      geometry: this.geometry.toJSON(),
      physics: { ...this.physics },
      accessories: this.accessories.map((item) => item.toJSON()),
      structuredFormulas: this.structuredFormulas.map((item) => ({ ...item })),
      glassFormulas: this.glassFormulas.map((item) => ({ ...item })),
      workshopOperations: this.workshopOperations.map((item) => ({ ...item })),
      metadata: { ...this.metadata }
    }
  }
}
