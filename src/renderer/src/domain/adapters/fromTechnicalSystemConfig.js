import { ConfiguredElement } from '../configuration/ConfiguredElement.js'

const parseDirection = (value) => {
  const token = String(value || '')
    .trim()
    .toLowerCase()
  if (['left', 'l', 'يسار', 'يسرى'].some((entry) => token.includes(entry))) return 'left'
  if (['right', 'r', 'يمين', 'يمنى'].some((entry) => token.includes(entry))) return 'right'
  return 'any'
}

const inferSashTypeFromSections = (sections = [], systemType = '') => {
  const hasSash = sections.some((section) => section.type === 'sash')
  const hasFixed = sections.some((section) => section.type === 'fixed')
  if (hasSash && hasFixed) return 'mixed'
  if (hasFixed && !hasSash) return 'fixed'
  if (
    String(systemType || '')
      .toLowerCase()
      .includes('casement')
  )
    return 'casement'
  if (
    String(systemType || '')
      .toLowerCase()
      .includes('sliding')
  )
    return 'sliding'
  return hasSash ? 'sash' : 'fixed'
}

export const createConfiguredElementFromTechnicalInput = ({
  system,
  opening,
  width,
  height,
  quantity,
  sections
}) => {
  const normalizedSections = (sections || []).map((section, index) => ({
    id: section.id ?? `${index + 1}`,
    index,
    type: section.type === 'fixed' ? 'fixed' : 'sash',
    widthM: Number(section.calcW || width || 0),
    heightM: Number(section.calcH || height || 0)
  }))

  return new ConfiguredElement({
    id: opening?.id || `${system?.id || 'system'}-${opening?.label || 'opening'}`,
    label: opening?.label || 'Configured element',
    systemId: system?.id || '',
    systemType: system?.systemType || 'custom',
    widthM: width,
    heightM: height,
    quantity,
    openingDirection: parseDirection(
      opening?.openingDirection || opening?.direction || opening?.handleDirection
    ),
    sashType:
      opening?.sashType || inferSashTypeFromSections(normalizedSections, system?.systemType),
    sections: normalizedSections
  })
}
