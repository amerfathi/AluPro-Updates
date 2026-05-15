import { asArray } from '../../shared/guards.js'

const normalizeToken = (value) =>
  String(value || '')
    .replace(/[\u200B-\u200F\u202A-\u202E]/g, '')
    .trim()
    .toLowerCase()

const includesAny = (token, entries) =>
  entries.some((entry) => token.includes(normalizeToken(entry)))

const detectElementKind = (opening = {}) => {
  const explicit = normalizeToken(opening.elementKind || opening.elementType || '')
  if (['window', 'نافذة', 'شباك'].includes(explicit)) return 'window'
  if (['door', 'باب', 'بوابة'].includes(explicit)) return 'door'
  if (['facade', 'واجهة', 'curtain', 'storefront'].some((entry) => explicit.includes(entry))) {
    return 'facade'
  }

  const labelToken = normalizeToken(opening.label || opening.name || '')
  if (includesAny(labelToken, ['باب', 'door', 'بوابة'])) return 'door'
  if (includesAny(labelToken, ['واجهة', 'facade', 'curtain', 'storefront'])) return 'facade'
  return 'window'
}

const detectOpeningMode = (opening = {}) => {
  const explicit = normalizeToken(opening.openingMode || opening.motionType || opening.sashType || '')
  if (includesAny(explicit, ['fixed', 'ثابت'])) return 'fixed'
  if (includesAny(explicit, ['sliding', 'slide', 'سحاب'])) return 'sliding'
  if (includesAny(explicit, ['hinged', 'casement', 'مفصلي', 'مفصلة'])) return 'hinged'
  if (includesAny(explicit, ['mixed', 'hybrid', 'مختلط'])) return 'mixed'

  const sectionTypes = new Set(
    asArray(opening.sections)
      .map((section) => normalizeToken(section?.type))
      .filter(Boolean)
  )

  if (sectionTypes.has('fixed') && sectionTypes.has('sash')) return 'mixed'
  if (sectionTypes.has('fixed') && !sectionTypes.has('sash')) return 'fixed'
  return 'auto'
}

export const inferOpeningDemand = (opening = {}) => ({
  elementKind: detectElementKind(opening),
  openingMode: detectOpeningMode(opening)
})

export const inferProfileCapabilities = (profile = {}) => {
  const systemToken = normalizeToken(profile.systemType || '')
  const nameToken = normalizeToken(profile.name || '')
  const token = `${systemToken} ${nameToken}`.trim()

  const modes = new Set()
  if (includesAny(token, ['sliding', 'slide', 'سحاب'])) modes.add('sliding')
  if (includesAny(token, ['hinged', 'casement', 'مفصلي', 'مفصلة'])) modes.add('hinged')
  if (includesAny(token, ['fixed', 'ثابت'])) modes.add('fixed')

  if (modes.size === 0) {
    if (systemToken === 'fixed') modes.add('fixed')
    else if (systemToken === 'sliding') modes.add('sliding')
    else if (systemToken === 'casement') modes.add('hinged')
    else modes.add('sliding')
  }

  const supportsDoor =
    includesAny(token, ['door', 'باب', 'بوابة']) || modes.has('hinged') || modes.has('sliding')
  const supportsFacade =
    includesAny(token, ['facade', 'واجهة', 'curtain', 'storefront']) ||
    modes.has('fixed') ||
    modes.has('sliding')

  return {
    profileId: String(profile.id || ''),
    profileName: String(profile.name || ''),
    modes: Array.from(modes),
    supportsDoor,
    supportsFacade,
    supportsWindow: true
  }
}

export const assessProfileCompatibility = (profile = {}, opening = {}) => {
  const demand = inferOpeningDemand(opening)
  const capabilities = inferProfileCapabilities(profile)
  const exclusionReasons = []
  const advisoryNotes = []

  if (demand.elementKind === 'door' && !capabilities.supportsDoor) {
    exclusionReasons.push('هذا القطاع غير مناسب للأبواب حسب نوعه الحالي.')
  }

  if (demand.elementKind === 'facade' && !capabilities.supportsFacade) {
    exclusionReasons.push('هذا القطاع غير مهيأ للواجهات الهيكلية أو الواجهات الثابتة.')
  }

  if (demand.openingMode === 'sliding' && !capabilities.modes.includes('sliding')) {
    exclusionReasons.push('وضع الحركة المطلوب سحاب، لكن القطاع لا يدعم السحاب.')
  }

  if (demand.openingMode === 'hinged' && !capabilities.modes.includes('hinged')) {
    exclusionReasons.push('وضع الحركة المطلوب مفصلي، لكن القطاع لا يدعم المفصلي.')
  }

  if (demand.openingMode === 'fixed' && !capabilities.modes.includes('fixed')) {
    exclusionReasons.push('العنصر ثابت، لكن القطاع المختار ليس ضمن القطاعات الثابتة.')
  }

  if (demand.openingMode === 'mixed') {
    const hasFixed = capabilities.modes.includes('fixed')
    const hasMoving =
      capabilities.modes.includes('sliding') || capabilities.modes.includes('hinged')
    if (!hasFixed || !hasMoving) {
      exclusionReasons.push('العنصر المختلط (ثابت + متحرك) يحتاج قطاع يدعم النوعين معًا.')
    }
  }

  if (demand.openingMode === 'auto') {
    advisoryNotes.push('لم يتم تحديد وضع حركة صريح، سيتم الاعتماد على قواعد النظام الفني.')
  }

  const eligible = exclusionReasons.length === 0
  let score = 0
  if (eligible) {
    score += demand.elementKind === 'door' && capabilities.supportsDoor ? 3 : 0
    score += demand.elementKind === 'facade' && capabilities.supportsFacade ? 3 : 0
    score += demand.elementKind === 'window' ? 2 : 0
    score += demand.openingMode !== 'auto' && capabilities.modes.includes(demand.openingMode) ? 3 : 0
    score += demand.openingMode === 'mixed' ? 2 : 0
    score += capabilities.modes.length
  }

  return {
    profileId: String(profile.id || ''),
    profileName: String(profile.name || ''),
    eligible,
    score,
    demand,
    capabilities,
    reasons: advisoryNotes,
    exclusions: exclusionReasons
  }
}

export const buildProfileSelectionPlan = (profiles = [], opening = {}) => {
  const evaluations = asArray(profiles).map((profile) =>
    assessProfileCompatibility(profile, opening)
  )

  const eligible = evaluations
    .filter((entry) => entry.eligible)
    .sort((left, right) => right.score - left.score)

  const excluded = evaluations.filter((entry) => !entry.eligible)

  return {
    demand: inferOpeningDemand(opening),
    eligible,
    excluded,
    hasEligibleProfiles: eligible.length > 0
  }
}
