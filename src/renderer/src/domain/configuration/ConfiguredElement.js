import { asArray, assertNonEmptyString, assertPositiveNumber } from '../shared/guards.js'

export const configuredSectionTypes = Object.freeze(['sash', 'fixed'])

const normalizeSection = (section = {}, index = 0) => {
  const requestedType = typeof section.type === 'string' ? section.type.trim().toLowerCase() : ''
  const type = configuredSectionTypes.includes(requestedType) ? requestedType : 'sash'

  return Object.freeze({
    id: String(section.id || `section-${index + 1}`),
    index,
    type,
    widthM: assertPositiveNumber(
      section.widthM ?? section.calcW ?? 1,
      `configuredSection[${index}].widthM`
    ),
    heightM: assertPositiveNumber(
      section.heightM ?? section.calcH ?? 1,
      `configuredSection[${index}].heightM`
    )
  })
}

const inferSashType = (providedSashType, sections = []) => {
  if (typeof providedSashType === 'string' && providedSashType.trim())
    return providedSashType.trim().toLowerCase()
  const types = new Set(asArray(sections).map((section) => section.type))
  if (types.has('sash') && types.has('fixed')) return 'mixed'
  if (types.has('fixed')) return 'fixed'
  return 'sash'
}

export class ConfiguredElement {
  constructor({
    id,
    label = '',
    systemId = '',
    systemType = 'custom',
    widthM,
    heightM,
    quantity = 1,
    openingDirection = 'any',
    sashType = '',
    sections = [],
    metadata = {}
  }) {
    this.id = assertNonEmptyString(String(id), 'configuredElement.id')
    this.label = typeof label === 'string' ? label.trim() : ''
    this.systemId = String(systemId || '')
    this.systemType =
      typeof systemType === 'string' && systemType.trim()
        ? systemType.trim().toLowerCase()
        : 'custom'
    this.widthM = assertPositiveNumber(widthM, 'configuredElement.widthM')
    this.heightM = assertPositiveNumber(heightM, 'configuredElement.heightM')
    this.quantity = assertPositiveNumber(quantity, 'configuredElement.quantity')
    this.openingDirection =
      typeof openingDirection === 'string' && openingDirection.trim()
        ? openingDirection.trim().toLowerCase()
        : 'any'

    const normalizedSections = asArray(sections).map((section, index) =>
      normalizeSection(section, index)
    )
    if (normalizedSections.length === 0) {
      normalizedSections.push(
        normalizeSection(
          {
            id: 'section-1',
            type: this.systemType === 'fixed' ? 'fixed' : 'sash',
            widthM: this.widthM,
            heightM: this.heightM
          },
          0
        )
      )
    }

    this.sections = Object.freeze(normalizedSections)
    this.sashType = inferSashType(sashType, this.sections)
    this.metadata = Object.freeze({ ...(metadata || {}) })

    Object.freeze(this)
  }

  getSashSections() {
    return this.sections.filter((section) => section.type === 'sash')
  }

  getFixedSections() {
    return this.sections.filter((section) => section.type === 'fixed')
  }

  toJSON() {
    return {
      id: this.id,
      label: this.label,
      systemId: this.systemId,
      systemType: this.systemType,
      widthM: this.widthM,
      heightM: this.heightM,
      quantity: this.quantity,
      openingDirection: this.openingDirection,
      sashType: this.sashType,
      sections: this.sections.map((section) => ({ ...section })),
      metadata: { ...this.metadata }
    }
  }
}
