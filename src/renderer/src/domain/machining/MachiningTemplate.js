import { asArray, assertNonNegativeNumber, assertNonEmptyString, assertOneOf } from '../shared/guards.js'

export const machiningTemplateTargetTypes = Object.freeze(['accessory_kind', 'profile_role'])

export const machiningTargetMatchModes = Object.freeze(['exact', 'prefix'])

export const machiningAnchorsX = Object.freeze(['left', 'center', 'right'])
export const machiningAnchorsY = Object.freeze(['top', 'center', 'bottom'])

export const machiningQuantityModes = Object.freeze(['per_source_quantity', 'fixed'])

const normalizeFormula = (value) => {
  if (typeof value === 'number') return value
  if (!value || typeof value !== 'object') return 0

  return Object.freeze({
    metric: String(value.metric || ''),
    operator: String(value.operator || 'set'),
    value: Number(value.value) || 0
  })
}

export class MachiningTemplate {
  constructor({
    id,
    name,
    operationCode,
    targetType,
    targetValues = [],
    targetMatchMode = 'exact',
    sectionTypes = ['all', 'fixed', 'sash'],
    referencePoint = {},
    quantityModel = {},
    holePattern = {},
    notes = ''
  }) {
    this.id = assertNonEmptyString(String(id), 'machiningTemplate.id')
    this.name = assertNonEmptyString(name || id, 'machiningTemplate.name')
    this.operationCode = assertNonEmptyString(
      operationCode || this.id,
      'machiningTemplate.operationCode'
    )
    this.targetType = assertOneOf(
      targetType,
      machiningTemplateTargetTypes,
      'machiningTemplate.targetType'
    )
    this.targetValues = Object.freeze(
      asArray(targetValues).map((value) => String(value || '').toLowerCase()).filter(Boolean)
    )
    this.targetMatchMode = assertOneOf(
      targetMatchMode,
      machiningTargetMatchModes,
      'machiningTemplate.targetMatchMode'
    )
    this.sectionTypes = Object.freeze(
      asArray(sectionTypes)
        .map((value) => String(value || '').toLowerCase())
        .filter((value) => ['all', 'fixed', 'sash'].includes(value))
    )

    this.referencePoint = Object.freeze({
      xAnchor: assertOneOf(
        referencePoint?.xAnchor || 'left',
        machiningAnchorsX,
        'machiningTemplate.referencePoint.xAnchor'
      ),
      yAnchor: assertOneOf(
        referencePoint?.yAnchor || 'top',
        machiningAnchorsY,
        'machiningTemplate.referencePoint.yAnchor'
      ),
      xOffsetMm: normalizeFormula(referencePoint?.xOffsetMm ?? 0),
      yOffsetMm: normalizeFormula(referencePoint?.yOffsetMm ?? 0)
    })

    this.quantityModel = Object.freeze({
      mode: assertOneOf(
        quantityModel?.mode || 'per_source_quantity',
        machiningQuantityModes,
        'machiningTemplate.quantityModel.mode'
      ),
      multiplier: assertNonNegativeNumber(
        quantityModel?.multiplier ?? 1,
        'machiningTemplate.quantityModel.multiplier',
        1
      )
    })

    this.holePattern = Object.freeze({
      holesPerOperation: assertNonNegativeNumber(
        holePattern?.holesPerOperation ?? 1,
        'machiningTemplate.holePattern.holesPerOperation',
        1
      ),
      spacingMm: assertNonNegativeNumber(
        holePattern?.spacingMm ?? 0,
        'machiningTemplate.holePattern.spacingMm',
        0
      )
    })

    this.notes = typeof notes === 'string' ? notes.trim() : ''

    Object.freeze(this)
  }

  matchesSource(source = {}) {
    const targetValue =
      this.targetType === 'accessory_kind'
        ? String(source?.accessoryKind || '').toLowerCase()
        : String(source?.physicalRole || '').toLowerCase()
    if (!targetValue) return false

    const sectionType = String(source?.sectionType || 'all').toLowerCase()
    const allowsSection =
      this.sectionTypes.length === 0 ||
      this.sectionTypes.includes('all') ||
      this.sectionTypes.includes(sectionType)
    if (!allowsSection) return false

    if (this.targetValues.length === 0) return true
    if (this.targetMatchMode === 'exact') return this.targetValues.includes(targetValue)
    return this.targetValues.some((prefix) => targetValue.startsWith(prefix))
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      operationCode: this.operationCode,
      targetType: this.targetType,
      targetValues: [...this.targetValues],
      targetMatchMode: this.targetMatchMode,
      sectionTypes: [...this.sectionTypes],
      referencePoint: {
        xAnchor: this.referencePoint.xAnchor,
        yAnchor: this.referencePoint.yAnchor,
        xOffsetMm: this.referencePoint.xOffsetMm,
        yOffsetMm: this.referencePoint.yOffsetMm
      },
      quantityModel: {
        mode: this.quantityModel.mode,
        multiplier: this.quantityModel.multiplier
      },
      holePattern: {
        holesPerOperation: this.holePattern.holesPerOperation,
        spacingMm: this.holePattern.spacingMm
      },
      notes: this.notes
    }
  }
}
