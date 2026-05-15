import {
  assertNonEmptyString,
  assertOneOf,
  assertPositiveNumber,
  asArray
} from '../shared/guards.js'
import { SemanticZone } from '../profile/SemanticZone.js'

export const accessoryCalcModes = Object.freeze([
  'per_opening',
  'per_section',
  'per_meter_width',
  'per_meter_height',
  'per_perimeter',
  'per_area'
])

export const accessorySectionTypes = Object.freeze(['all', 'fixed', 'sash'])

export class Accessory {
  constructor({
    id,
    name,
    inventoryId,
    qtyPerWindow = 1,
    calcMode = 'per_opening',
    sectionType = 'all',
    compatibleZones = [],
    metadata = {}
  }) {
    this.id = assertNonEmptyString(id, 'accessory.id')
    this.name = assertNonEmptyString(name, 'accessory.name')
    this.inventoryId = assertNonEmptyString(inventoryId, 'accessory.inventoryId')
    this.qtyPerWindow = assertPositiveNumber(qtyPerWindow, 'accessory.qtyPerWindow')
    this.calcMode = assertOneOf(calcMode, accessoryCalcModes, 'accessory.calcMode')
    this.sectionType = assertOneOf(sectionType, accessorySectionTypes, 'accessory.sectionType')
    this.compatibleZones = Object.freeze(
      asArray(compatibleZones).map((zone) => SemanticZone.from(zone).id)
    )
    this.metadata = Object.freeze({ ...(metadata || {}) })

    Object.freeze(this)
  }

  supportsSection(sectionType) {
    if (this.sectionType === 'all') return true
    return this.sectionType === sectionType
  }

  supportsZone(zoneId) {
    if (this.compatibleZones.length === 0) return true
    const zone = SemanticZone.from(zoneId)
    return this.compatibleZones.includes(zone.id)
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      inventoryId: this.inventoryId,
      qtyPerWindow: this.qtyPerWindow,
      calcMode: this.calcMode,
      sectionType: this.sectionType,
      compatibleZones: [...this.compatibleZones],
      metadata: { ...this.metadata }
    }
  }

  static from(value, fallbackId = 'accessory') {
    if (value instanceof Accessory) return value
    return new Accessory({
      id: value?.id ? String(value.id) : fallbackId,
      name: value?.name || 'Accessory',
      inventoryId: value?.inventoryId || '',
      qtyPerWindow: value?.qtyPerWindow ?? 1,
      calcMode: value?.calcMode || 'per_opening',
      sectionType: value?.sectionType || 'all',
      compatibleZones: value?.compatibleZones || [],
      metadata: value?.metadata || {}
    })
  }
}
