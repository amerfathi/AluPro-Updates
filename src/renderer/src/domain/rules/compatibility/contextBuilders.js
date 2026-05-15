import { asArray } from '../../shared/guards.js'

const arabicToEnglishDigits = (value) =>
  String(value || '')
    .replace(/[\u200B-\u200F\u202A-\u202E]/g, '')
    .replace(/[٠-٩]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit))
    .replace(/[۰-۹]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))
    .replace(/٫/g, '.')
    .replace(/،/g, '.')
    .replace(/,/g, '.')

const normalizeToken = (value) => arabicToEnglishDigits(value).trim().toLowerCase()

const normalizeDirection = (value) => {
  const token = normalizeToken(value)
  if (!token) return 'any'
  if (['left', 'l', 'يسار', 'يسرى'].some((entry) => token.includes(entry))) return 'left'
  if (['right', 'r', 'يمين', 'يمنى'].some((entry) => token.includes(entry))) return 'right'
  return 'any'
}

const normalizeFamily = (value) => {
  const token = normalizeToken(value)
  if (!token) return 'custom'
  if (token.includes('slide') || token.includes('sliding') || token.includes('سحاب'))
    return 'sliding'
  if (
    token.includes('hinge') ||
    token.includes('casement') ||
    token.includes('مفصل') ||
    token.includes('مفصلي')
  ) {
    return 'casement'
  }
  if (token.includes('fixed') || token.includes('ثابت')) return 'fixed'
  if (token.includes('door') || token.includes('باب')) return 'door'
  return token
}

const inferSashType = ({ opening, profileFamily }) => {
  const explicit = normalizeFamily(opening?.sashType || '')
  if (explicit && explicit !== 'custom') return explicit

  const sectionTypes = new Set(
    asArray(opening?.sections)
      .map((section) => section?.type)
      .filter(Boolean)
  )
  if (sectionTypes.has('sash') && sectionTypes.has('fixed')) return 'mixed'
  if (sectionTypes.has('sash')) {
    if (profileFamily === 'casement') return 'casement'
    return 'sliding'
  }
  if (sectionTypes.has('fixed')) return 'fixed'
  return profileFamily === 'fixed' ? 'fixed' : profileFamily
}

const parseThicknessFromText = (value) => {
  const text = arabicToEnglishDigits(value)
  if (!text) return null

  if (text.includes('+')) {
    const values = text
      .split('+')
      .map((entry) => Number.parseFloat(entry))
      .filter((entry) => Number.isFinite(entry))

    if (values.length > 0) {
      const sum = values.reduce((total, entry) => total + entry, 0)
      return Number(sum.toFixed(2))
    }
  }

  const matches = text.match(/(\d+(\.\d+)?)/g)
  if (!matches || matches.length === 0) return null

  const first = Number.parseFloat(matches[0])
  return Number.isFinite(first) ? Number(first.toFixed(2)) : null
}

const classifyAccessoryType = (name) => {
  const token = normalizeToken(name)
  if (!token) return 'generic'
  if (['roller', 'wheel', 'بكرة', 'بكرات', 'كفرات', 'رول'].some((entry) => token.includes(entry))) {
    return 'roller'
  }
  if (['hinge', 'مفصلة', 'مفصلات', 'كباس'].some((entry) => token.includes(entry))) {
    return 'hinge'
  }
  if (['lock', 'قفل', 'كالون', 'سيليندر'].some((entry) => token.includes(entry))) {
    return 'lock'
  }
  if (['handle', 'مسكة', 'مقبض'].some((entry) => token.includes(entry))) {
    return 'handle'
  }
  if (['gasket', 'كاوتش', 'جلدة', 'rubber'].some((entry) => token.includes(entry))) {
    return 'gasket'
  }
  return 'generic'
}

const inferSupportedOpeningDirections = (name, explicitDirections = null) => {
  const explicit = asArray(explicitDirections)
    .map((entry) => normalizeDirection(entry))
    .filter(Boolean)

  if (explicit.length > 0) {
    const unique = Array.from(new Set(explicit))
    return unique.includes('any') ? ['left', 'right', 'any'] : unique
  }

  const token = normalizeToken(name)
  const hasLeft = ['left', 'يسار', 'يسرى'].some((entry) => token.includes(entry))
  const hasRight = ['right', 'يمين', 'يمنى'].some((entry) => token.includes(entry))

  if (hasLeft && hasRight) return ['left', 'right', 'any']
  if (hasLeft) return ['left']
  if (hasRight) return ['right']
  return ['left', 'right', 'any']
}

const isHardwareAccessory = (accessoryType) =>
  ['roller', 'hinge', 'lock', 'handle'].includes(accessoryType)

export const buildCompatibilityValidationContext = ({ system, inventory = [], opening = null }) => {
  const normalizedProfileFamily = normalizeFamily(
    system?.profileFamily || system?.systemType || 'custom'
  )
  const openingDirection = normalizeDirection(
    opening?.openingDirection || opening?.direction || opening?.handleDirection
  )
  const sashType = inferSashType({ opening, profileFamily: normalizedProfileFamily })
  const inventoryMap = new Map(asArray(inventory).map((item) => [item.id, item]))

  const systemRecord = {
    id: String(system?.id || system?.name || 'system'),
    profileFamily: normalizedProfileFamily,
    frameProfileType: normalizedProfileFamily,
    sashType,
    openingDirection
  }

  const glassItems = asArray(system?.glassFormulas).map((formula, index) => {
    const inventoryItem = inventoryMap.get(formula?.inventoryId)
    const thicknessMm =
      parseThicknessFromText(formula?.thicknessMm) ||
      parseThicknessFromText(formula?.type) ||
      parseThicknessFromText(inventoryItem?.name) ||
      parseThicknessFromText(formula?.label)

    return {
      id: String(formula?.id || `glass-${index + 1}`),
      profileFamily: normalizedProfileFamily,
      frameProfileType: normalizedProfileFamily,
      openingDirection,
      inventoryId: formula?.inventoryId || '',
      thicknessMm
    }
  })

  const accessoryItems = asArray(system?.accessories).map((accessory, index) => {
    const inventoryItem = inventoryMap.get(accessory?.inventoryId)
    const sourceName = `${accessory?.name || ''} ${inventoryItem?.name || ''}`.trim()
    const accessoryType = classifyAccessoryType(sourceName)
    const supportedOpeningDirections = inferSupportedOpeningDirections(
      sourceName,
      accessory?.supportedOpeningDirections
    )

    return {
      id: String(accessory?.id || `accessory-${index + 1}`),
      profileFamily: normalizedProfileFamily,
      frameProfileType: normalizedProfileFamily,
      openingDirection,
      inventoryId: accessory?.inventoryId || '',
      sectionType: accessory?.sectionType || 'all',
      calcMode: accessory?.calcMode || 'per_opening',
      accessoryType,
      supportedOpeningDirections,
      isHardware: isHardwareAccessory(accessoryType)
    }
  })

  return {
    system: systemRecord,
    glassItems,
    accessoryItems,
    hardwareItems: accessoryItems.filter((item) => item.isHardware)
  }
}
