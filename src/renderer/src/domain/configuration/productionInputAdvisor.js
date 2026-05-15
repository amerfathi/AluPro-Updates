import { asArray } from '../shared/guards.js'
import { buildProfileSelectionPlan } from '../rules/compatibility/profileSelectionAdvisor.js'

const toPositiveNumber = (value) => {
  if (value === null || value === undefined) return 0
  const normalized = String(value)
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .trim()
  return Math.max(0, Number(normalized) || 0)
}

export const evaluateProductionInputReadiness = ({
  profiles = [],
  windowInput = {},
  projectInfo = {},
  mainSystemId = ''
} = {}) => {
  const selectionPlan = buildProfileSelectionPlan(profiles, windowInput)
  const selectedProfileReview =
    selectionPlan.eligible.find((item) => item.profileId === String(mainSystemId)) ||
    selectionPlan.excluded.find((item) => item.profileId === String(mainSystemId)) ||
    null
  const topSuggestedProfile = selectionPlan.eligible[0] || null

  const widthM = toPositiveNumber(windowInput?.width)
  const heightM = toPositiveNumber(windowInput?.height)
  const quantity = toPositiveNumber(windowInput?.quantity)
  const sectionRows = asArray(windowInput?.sections)
  const sectionHeightsTotal = sectionRows.reduce((sum, section) => sum + toPositiveNumber(section?.h), 0)
  const sectionGap = Number((heightM - sectionHeightsTotal).toFixed(3))
  const hasCoreDimensions = widthM > 0 && heightM > 0 && quantity > 0

  const hasCompatibleSelection = mainSystemId
    ? Boolean(selectedProfileReview?.eligible)
    : Boolean(topSuggestedProfile)

  const readinessChecks = [
    {
      id: 'client',
      label: 'اسم العميل',
      done: Boolean(String(projectInfo?.clientName || '').trim())
    },
    {
      id: 'dimensions',
      label: 'الأبعاد والعدد',
      done: hasCoreDimensions
    },
    {
      id: 'catalog',
      label: 'وجود قطاع متوافق',
      done: selectionPlan.hasEligibleProfiles
    },
    {
      id: 'selection',
      label: 'اختيار قطاع صالح',
      done: hasCompatibleSelection
    },
    {
      id: 'sections',
      label: 'سلامة التقسيم الداخلي',
      done:
        !windowInput?.isComplex ||
        sectionRows.every((section) => toPositiveNumber(section?.h) > 0)
    }
  ]

  const readinessDone = readinessChecks.filter((check) => check.done).length
  const readinessPercent = Math.round((readinessDone / readinessChecks.length) * 100)
  const nextAction = readinessChecks.find((check) => !check.done) || null

  const advisoryNotes = []
  if (windowInput?.isComplex && heightM > 0 && sectionRows.length > 0) {
    if (sectionGap < -0.03) {
      advisoryNotes.push('مجموع ارتفاعات الأقسام أكبر من الارتفاع الكلي. راجع التقسيم.')
    } else if (sectionGap > 0.1) {
      advisoryNotes.push('يوجد فرق ارتفاع غير موزع بين الأقسام. يمكن ضبط الأقسام تلقائيًا.')
    }
  }
  if (!selectionPlan.hasEligibleProfiles) {
    advisoryNotes.push('لا يوجد قطاع متوافق مع الإعداد الحالي. غيّر نوع العنصر أو نمط الفتح.')
  }

  const canInsert = hasCoreDimensions && selectionPlan.hasEligibleProfiles && hasCompatibleSelection

  return {
    selectionPlan,
    selectedProfileReview,
    topSuggestedProfile,
    hasCoreDimensions,
    hasCompatibleSelection,
    canInsert,
    readinessChecks,
    readinessPercent,
    nextAction,
    advisoryNotes,
    sectionRows,
    sectionGap
  }
}

