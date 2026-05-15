import { assertNonEmptyString, assertOneOf, assertPositiveNumber } from '../shared/guards.js'

export const bomItemKinds = Object.freeze([
  'profile',
  'glass',
  'gasket',
  'hinge',
  'lock',
  'accessory'
])

const inferUnitByKind = (kind) => {
  if (kind === 'profile') return 'meter'
  if (kind === 'glass') return 'piece'
  return 'unit'
}

export class BOMItem {
  constructor({
    id,
    kind,
    label,
    quantity,
    inventoryId = '',
    unit = '',
    sourceNodeId = '',
    metadata = {}
  }) {
    this.id = assertNonEmptyString(String(id), 'bomItem.id')
    this.kind = assertOneOf(kind, bomItemKinds, 'bomItem.kind')
    this.label = assertNonEmptyString(String(label || ''), 'bomItem.label')
    this.quantity = assertPositiveNumber(quantity, 'bomItem.quantity')
    this.inventoryId = String(inventoryId || '')
    this.unit = String(unit || inferUnitByKind(this.kind))
    this.sourceNodeId = String(sourceNodeId || '')
    this.metadata = Object.freeze({ ...(metadata || {}) })

    Object.freeze(this)
  }

  toJSON() {
    return {
      id: this.id,
      kind: this.kind,
      label: this.label,
      quantity: this.quantity,
      inventoryId: this.inventoryId,
      unit: this.unit,
      sourceNodeId: this.sourceNodeId,
      metadata: { ...this.metadata }
    }
  }
}
