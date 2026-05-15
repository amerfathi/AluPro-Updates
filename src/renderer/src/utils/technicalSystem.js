import { parseArabicNum } from './number.js'
import { buildCompatibilityValidationContext } from '../domain/rules/compatibility/contextBuilders.js'
import { createDefaultCompatibilityRulesEngine } from '../domain/rules/fixtures/defaultCompatibilityRules.js'
import { generateAssemblyTreeForTechnicalWindow } from '../domain/configuration/generateAssemblyTree.js'
import { generateBOMFromAssemblyTree } from '../domain/bom/generateBOMFromAssemblyTree.js'
import { generateMachiningOperations } from '../domain/machining/generateMachiningOperations.js'

export const defaultTechnicalSystemPhysics = Object.freeze({
  frameDedW: '5',
  frameDedH: '5',
  sashDedW: '12',
  sashDedH: '12'
})

export const technicalAccessoryCalcModes = [
  { value: 'per_opening', label: 'لكل فتحة' },
  { value: 'per_section', label: 'لكل قسم' },
  { value: 'per_meter_width', label: 'لكل متر عرض' },
  { value: 'per_meter_height', label: 'لكل متر ارتفاع' },
  { value: 'per_perimeter', label: 'لكل متر محيط' },
  { value: 'per_area', label: 'لكل متر مربع' }
]

export const technicalOperationCategories = [
  { value: 'machining', label: 'Machining' },
  { value: 'cutting', label: 'قص وتجهيز' },
  { value: 'assembly', label: 'تجميع' },
  { value: 'glazing', label: 'زجاج' },
  { value: 'hardware', label: 'إكسسوارات وتركيب' },
  { value: 'finishing', label: 'تشطيب وضبط' },
  { value: 'packing', label: 'تغليف وتسليم' }
]

const toNumber = (value, fallback = 0) => {
  const parsed = parseFloat(parseArabicNum(value))
  return Number.isFinite(parsed) ? parsed : fallback
}

const toPositiveInt = (value, fallback = 1) => {
  const parsed = Math.floor(toNumber(value, fallback))
  return parsed > 0 ? parsed : fallback
}

const inferDefaultSectionType = (systemType) => (systemType === 'fixed' ? 'fixed' : 'sash')
const compatibilityRulesEngine = createDefaultCompatibilityRulesEngine()

const pushUniqueMessage = (bucket, message) => {
  if (!message || bucket.includes(message)) return
  bucket.push(message)
}

const normalizePhysics = (physics = {}) => ({
  frameDedW: toNumber(physics.frameDedW, toNumber(defaultTechnicalSystemPhysics.frameDedW, 5)),
  frameDedH: toNumber(physics.frameDedH, toNumber(defaultTechnicalSystemPhysics.frameDedH, 5)),
  sashDedW: toNumber(physics.sashDedW, toNumber(defaultTechnicalSystemPhysics.sashDedW, 12)),
  sashDedH: toNumber(physics.sashDedH, toNumber(defaultTechnicalSystemPhysics.sashDedH, 12))
})

const normalizeFormula = (formula = {}, index = 0) => ({
  id: formula.id ?? Date.now() + index,
  label: formula.label || '',
  qty: toPositiveInt(formula.qty, 1),
  cutType: formula.cutType === '90' ? '90' : '45',
  inventoryId: formula.inventoryId || '',
  physicalRole: formula.physicalRole || 'sash_w',
  divideBy: toPositiveInt(formula.divideBy, 1),
  offsetCm: toNumber(formula.offsetCm, 0)
})

const normalizeGlassFormula = (formula = {}, index = 0) => ({
  id: formula.id ?? Date.now() + index,
  label: formula.label || 'زجاج',
  qty: toPositiveInt(formula.qty, 1),
  inventoryId: formula.inventoryId || '',
  physicalRole: formula.physicalRole || 'glass_fixed',
  divideW: toPositiveInt(formula.divideW, 1),
  offsetW: toNumber(formula.offsetW, 0),
  divideH: toPositiveInt(formula.divideH, 1),
  offsetH: toNumber(formula.offsetH, 0)
})

const normalizeAccessory = (accessory = {}, index = 0) => ({
  id: accessory.id ?? Date.now() + index,
  name: accessory.name || 'إكسسوار',
  qtyPerWindow: toNumber(accessory.qtyPerWindow, 1),
  inventoryId: accessory.inventoryId || '',
  calcMode: technicalAccessoryCalcModes.some((mode) => mode.value === accessory.calcMode)
    ? accessory.calcMode
    : 'per_opening',
  sectionType: ['all', 'fixed', 'sash'].includes(accessory.sectionType)
    ? accessory.sectionType
    : 'sash'
})

const normalizeWorkshopOperation = (operation = {}, index = 0) => ({
  id: operation.id ?? Date.now() + index,
  name: operation.name || 'عملية ورشة',
  category: technicalOperationCategories.some((item) => item.value === operation.category)
    ? operation.category
    : 'assembly',
  qtyFactor: toNumber(operation.qtyFactor, 1),
  calcMode: technicalAccessoryCalcModes.some((mode) => mode.value === operation.calcMode)
    ? operation.calcMode
    : 'per_opening',
  sectionType: ['all', 'fixed', 'sash'].includes(operation.sectionType)
    ? operation.sectionType
    : 'all',
  unitLabel: operation.unitLabel || 'عملية',
  costPerUnit: toNumber(operation.costPerUnit, 0),
  notes: operation.notes || ''
})

export const normalizeTechnicalSystem = (system = {}) => ({
  ...system,
  name: system.name || '',
  systemType: system.systemType || 'sliding',
  color: system.color || '',
  miterWasteCm: toNumber(system.miterWasteCm, 6.5),
  mullionThicknessCm: toNumber(system.mullionThicknessCm, 4),
  physics: normalizePhysics(system.physics),
  structuredFormulas: (system.structuredFormulas || []).map(normalizeFormula),
  glassFormulas: (system.glassFormulas || []).map(normalizeGlassFormula),
  accessories: (system.accessories || []).map(normalizeAccessory),
  workshopOperations: (system.workshopOperations || []).map(normalizeWorkshopOperation)
})

export const validateTechnicalSystem = (system, inventory = [], options = {}) => {
  const normalized = normalizeTechnicalSystem(system)
  const inventoryMap = new Map(inventory.map((item) => [item.id, item]))
  const errors = []
  const warnings = []

  if (!normalized.name.trim()) errors.push('اسم النظام الفني مطلوب.')
  if (normalized.structuredFormulas.length === 0) {
    errors.push('يجب إضافة سطر واحد على الأقل في الألمنيوم المطلوب.')
  }

  const aluminumRoles = new Set()

  normalized.structuredFormulas.forEach((formula, index) => {
    const inventoryItem = inventoryMap.get(formula.inventoryId)
    if (!formula.inventoryId) errors.push(`سطر الألمنيوم رقم ${index + 1} غير مربوط بصنف مخزون.`)
    if (inventoryItem && inventoryItem.category !== 'aluminum') {
      errors.push(`سطر الألمنيوم رقم ${index + 1} مربوط بصنف ليس من فئة الألمنيوم.`)
    }
    if (!formula.label.trim())
      warnings.push(`سطر الألمنيوم رقم ${index + 1} لا يحتوي على مسمى واضح.`)
    aluminumRoles.add(formula.physicalRole)
  })

  normalized.glassFormulas.forEach((formula, index) => {
    const inventoryItem = inventoryMap.get(formula.inventoryId)
    if (!formula.inventoryId) errors.push(`سطر الزجاج رقم ${index + 1} غير مربوط بصنف مخزون.`)
    if (inventoryItem && inventoryItem.category !== 'glass') {
      errors.push(`سطر الزجاج رقم ${index + 1} مربوط بصنف ليس من فئة الزجاج.`)
    }
  })

  normalized.accessories.forEach((accessory, index) => {
    const inventoryItem = inventoryMap.get(accessory.inventoryId)
    if (!accessory.inventoryId) errors.push(`سطر الإكسسوار رقم ${index + 1} غير مربوط بصنف مخزون.`)
    if (inventoryItem && inventoryItem.category !== 'accessory') {
      errors.push(`سطر الإكسسوار رقم ${index + 1} مربوط بصنف ليس من فئة الإكسسوارات.`)
    }
    if (accessory.qtyPerWindow <= 0) {
      errors.push(`سطر الإكسسوار رقم ${index + 1} يحتاج قيمة احتساب أكبر من صفر.`)
    }
  })

  normalized.workshopOperations.forEach((operation, index) => {
    if (!operation.name.trim()) {
      errors.push(`سطر عملية الورشة رقم ${index + 1} يحتاج مسمى واضح.`)
    }
    if (operation.qtyFactor <= 0) {
      errors.push(`سطر عملية الورشة رقم ${index + 1} يحتاج معامل أكبر من صفر.`)
    }
    if (operation.costPerUnit < 0) {
      errors.push(`سطر عملية الورشة رقم ${index + 1} يحتوي تكلفة تشغيل غير صالحة.`)
    }
  })

  if (!aluminumRoles.has('frame_w') || !aluminumRoles.has('frame_h')) {
    warnings.push('النظام الفني لا يحتوي على حلق عرض وطول بشكل صريح.')
  }

  if (normalized.glassFormulas.length === 0) {
    warnings.push('لا توجد معادلات زجاج مرتبطة بهذا النظام.')
  }

  if (normalized.accessories.length === 0) {
    warnings.push('لا توجد إكسسوارات مرتبطة بهذا النظام.')
  }

  if (normalized.workshopOperations.length === 0) {
    warnings.push('لا توجد عمليات ورشة مرتبطة بهذا النظام.')
  }

  const compatibilityContext = buildCompatibilityValidationContext({
    system: normalized,
    inventory,
    opening: options?.opening || null
  })
  const compatibilityValidation = compatibilityRulesEngine.validate(compatibilityContext)

  compatibilityValidation.errors.forEach((issue) => pushUniqueMessage(errors, issue.message))
  compatibilityValidation.warnings.forEach((issue) => pushUniqueMessage(warnings, issue.message))

  return {
    normalized,
    errors,
    warnings,
    compatibility: compatibilityValidation,
    summary: {
      aluminumCount: normalized.structuredFormulas.length,
      glassCount: normalized.glassFormulas.length,
      accessoriesCount: normalized.accessories.length,
      operationsCount: normalized.workshopOperations.length,
      compatibilityErrors: compatibilityValidation.errors.length,
      compatibilityWarnings: compatibilityValidation.warnings.length
    }
  }
}

const roleMatchesSection = (role, sectionType) => {
  if (!role) return false
  if (sectionType === 'fixed') return role.includes('fixed')
  return role.includes('sash')
}

const resolveRoleBaseLength = (role, { width, height, sectionHeight, physics }) => {
  switch (role) {
    case 'frame_w':
      return width
    case 'frame_h':
      return height
    case 'mullion_w':
      return width - physics.frameDedW / 100
    case 'mullion_h':
      return height - physics.frameDedH / 100
    case 'sash_w':
      return width - physics.frameDedW / 100
    case 'sash_h':
      return sectionHeight - physics.frameDedH / 100
    case 'bead_fixed_w':
      return width - physics.frameDedW / 100
    case 'bead_fixed_h':
      return sectionHeight - physics.frameDedH / 100
    case 'bead_sash_w':
      return width - physics.frameDedW / 100 - physics.sashDedW / 100
    case 'bead_sash_h':
      return sectionHeight - physics.frameDedH / 100 - physics.sashDedH / 100
    default:
      return role.endsWith('_h') ? sectionHeight : width
  }
}

const calculateFinalLength = (baseLength, divideBy, offsetCm, forceSingle = false) => {
  const divisor = forceSingle ? 1 : toPositiveInt(divideBy, 1)
  const finalLength = baseLength / divisor + toNumber(offsetCm, 0) / 100
  return finalLength > 0 ? Number(finalLength.toFixed(3)) : 0
}

const getRelevantSections = (sectionType, sections) =>
  sectionType === 'all' ? sections : sections.filter((section) => section.type === sectionType)

const calculateAccessoryBaseMeasure = (accessory, { width, height, sections }) => {
  const relevantSections = getRelevantSections(accessory.sectionType, sections)
  const sectionCount =
    accessory.sectionType === 'all'
      ? Math.max(sections.length, 1)
      : Math.max(relevantSections.length, 0)

  switch (accessory.calcMode) {
    case 'per_opening':
      return 1
    case 'per_section':
      return sectionCount
    case 'per_meter_width':
      return accessory.sectionType === 'all'
        ? width
        : relevantSections.reduce((sum, section) => sum + (section.calcW || width || 0), 0)
    case 'per_meter_height':
      return accessory.sectionType === 'all'
        ? height
        : relevantSections.reduce((sum, section) => sum + (section.calcH || 0), 0)
    case 'per_perimeter':
      return accessory.sectionType === 'all'
        ? 2 * (width + height)
        : relevantSections.reduce(
            (sum, section) => sum + 2 * ((section.calcW || width || 0) + (section.calcH || 0)),
            0
          )
    case 'per_area':
      return accessory.sectionType === 'all'
        ? width * height
        : relevantSections.reduce(
            (sum, section) => sum + (section.calcW || width || 0) * (section.calcH || 0),
            0
          )
    default:
      return 1
  }
}

const buildAccessoryLabel = (accessory) => {
  if (accessory.sectionType === 'fixed') return `${accessory.name} (ثابت)`
  if (accessory.sectionType === 'sash') return `${accessory.name} (متحرك)`
  return accessory.name
}

const buildOperationLabel = (operation) => {
  if (operation.sectionType === 'fixed') return `${operation.name} - قسم ثابت`
  if (operation.sectionType === 'sash') return `${operation.name} - قسم متحرك`
  return operation.name
}

const createProcessedSections = (normalizedSystem, opening, width, height) => {
  const defaultSectionType =
    opening.sections?.[0]?.type || inferDefaultSectionType(normalizedSystem.systemType)
  const hasComplexSections =
    Boolean(opening.isComplex) && Array.isArray(opening.sections) && opening.sections.length > 0

  if (!hasComplexSections) {
    return [{ id: 1, type: defaultSectionType, calcW: width, calcH: height }]
  }

  let specifiedHeight = 0
  let autoCount = 0
  const initialSections = opening.sections.map((section, index) => {
    const parsedHeight = toNumber(section.h, 0)
    if (parsedHeight > 0) {
      specifiedHeight += parsedHeight
    } else {
      autoCount += 1
    }

    return {
      id: section.id ?? index + 1,
      type: section.type || defaultSectionType,
      calcW: width,
      calcH: parsedHeight
    }
  })

  const remainingHeight =
    height -
    specifiedHeight -
    (Math.max(0, initialSections.length - 1) * normalizedSystem.mullionThicknessCm) / 100
  const autoHeight = autoCount > 0 ? remainingHeight / autoCount : 0

  return initialSections.map((section) => ({
    ...section,
    calcH: section.calcH > 0 ? section.calcH : Number(autoHeight.toFixed(3))
  }))
}

export const buildTechnicalSystemAssemblyTree = ({ system, opening }) => {
  const normalized = normalizeTechnicalSystem(system)
  const width = toNumber(opening?.width, 0)
  const height = toNumber(opening?.height, 0)
  const quantity = toPositiveInt(opening?.quantity, 1)

  if (width <= 0 || height <= 0) return null

  const sections = createProcessedSections(normalized, opening, width, height)
  return generateAssemblyTreeForTechnicalWindow({
    system: normalized,
    opening,
    width,
    height,
    quantity,
    sections
  }).toJSON()
}

export const compileTechnicalSystemWindow = ({ system, opening }) => {
  const normalized = normalizeTechnicalSystem(system)
  const width = toNumber(opening.width, 0)
  const height = toNumber(opening.height, 0)
  const quantity = toPositiveInt(opening.quantity, 1)
  const label = (opening.label || 'عنصر').trim()

  if (width <= 0 || height <= 0) {
    return {
      normalized,
      pieces: [],
      glass: [],
      accessories: [],
      bomItems: [],
      machiningOperations: [],
      operations: [],
      sections: [],
      assemblyTree: null,
      errors: ['يرجى إدخال العرض والارتفاع بشكل صحيح.']
    }
  }

  const sections = createProcessedSections(normalized, opening, width, height)
  const assemblyTree = generateAssemblyTreeForTechnicalWindow({
    system: normalized,
    opening,
    width,
    height,
    quantity,
    sections
  }).toJSON()
  const bom = generateBOMFromAssemblyTree({
    assemblyTree,
    system: normalized
  })
  const pieces = [...bom.pieces]
  const glass = [...bom.glass]
  const accessories = [...bom.accessories]
  const operations = []
  const isComplex = sections.length > 1

  // Legacy path kept temporarily for compatibility during phased migration.
  // BOM now comes from the assembly tree domain pipeline above.
  ;[].forEach((formula) => {
    const role = formula.physicalRole

    if (role.startsWith('frame') || role.startsWith('mullion')) {
      const baseLength = resolveRoleBaseLength(role, {
        width,
        height,
        sectionHeight: height,
        physics: normalized.physics
      })
      const multiplier = role.startsWith('mullion')
        ? Math.max(0, sections.length - 1) * formula.qty * quantity
        : formula.qty * quantity
      const finalLength = calculateFinalLength(baseLength, formula.divideBy, formula.offsetCm)

      if (finalLength > 0 && multiplier > 0) {
        pieces.push({
          id: Math.random(),
          profileId: normalized.id,
          inventoryId: formula.inventoryId,
          label: `${label} - ${formula.label || 'قطاع'}`,
          length: finalLength,
          quantity: multiplier,
          cutType: formula.cutType,
          physicalRole: role,
          miterWasteCm: normalized.miterWasteCm
        })
      }

      return
    }

    sections.forEach((section, sectionIndex) => {
      if (!roleMatchesSection(role, section.type)) return

      const sectionLabel = isComplex ? `(مقطع ${sectionIndex + 1})` : ''
      const forceSingle = !isComplex && section.type === 'fixed'
      const baseLength = resolveRoleBaseLength(role, {
        width,
        height,
        sectionHeight: section.calcH,
        physics: normalized.physics
      })
      const finalLength = calculateFinalLength(
        baseLength,
        formula.divideBy,
        formula.offsetCm,
        forceSingle
      )

      if (finalLength > 0) {
        pieces.push({
          id: Math.random(),
          profileId: normalized.id,
          inventoryId: formula.inventoryId,
          label: `${label} ${sectionLabel} - ${formula.label || 'قطاع'}`.trim(),
          length: finalLength,
          quantity: formula.qty * quantity,
          cutType: formula.cutType,
          physicalRole: role,
          miterWasteCm: normalized.miterWasteCm
        })
      }
    })
  })

  ;[].forEach((formula) => {
    sections.forEach((section, sectionIndex) => {
      if (!roleMatchesSection(formula.physicalRole, section.type)) return

      const sectionLabel = isComplex ? `(مقطع ${sectionIndex + 1})` : ''
      const forceSingle = !isComplex && section.type === 'fixed'
      const widthValue = calculateFinalLength(width, formula.divideW, formula.offsetW, forceSingle)
      const heightValue = calculateFinalLength(
        section.calcH,
        formula.divideH,
        formula.offsetH,
        forceSingle
      )

      if (widthValue > 0 && heightValue > 0) {
        glass.push({
          id: Math.random(),
          profileId: normalized.id,
          inventoryId: formula.inventoryId,
          label: `${label} ${sectionLabel} - ${formula.label || 'زجاج'}`.trim(),
          w: widthValue,
          h: heightValue,
          quantity: formula.qty * quantity,
          physicalRole: formula.physicalRole
        })
      }
    })
  })

  ;[].forEach((accessory) => {
    const baseMeasure = calculateAccessoryBaseMeasure(accessory, {
      width,
      height,
      sections
    })
    const finalQty = Number((accessory.qtyPerWindow * baseMeasure * quantity).toFixed(3))

    if (finalQty <= 0) return

    accessories.push({
      id: Math.random(),
      profileId: normalized.id,
      inventoryId: accessory.inventoryId,
      name: buildAccessoryLabel(accessory),
      quantity: finalQty,
      sectionType: accessory.sectionType,
      calcMode: accessory.calcMode
    })
  })

  normalized.workshopOperations.forEach((operation) => {
    const baseMeasure = calculateAccessoryBaseMeasure(operation, {
      width,
      height,
      sections
    })
    const quantityValue = Number((operation.qtyFactor * baseMeasure * quantity).toFixed(3))

    if (quantityValue <= 0) return

    operations.push({
      id: Math.random(),
      profileId: normalized.id,
      name: buildOperationLabel(operation),
      category: operation.category,
      quantity: quantityValue,
      unitLabel: operation.unitLabel,
      calcMode: operation.calcMode,
      sectionType: operation.sectionType,
      costPerUnit: operation.costPerUnit,
      totalCost: Number((quantityValue * operation.costPerUnit).toFixed(3)),
      notes: operation.notes
    })
  })

  const machiningOperations = generateMachiningOperations({
    system: normalized,
    bom,
    assemblyTree
  })

  if (machiningOperations.length > 0) {
    operations.push(...machiningOperations)
  }

  return {
    normalized,
    pieces,
    glass,
    accessories,
    bomItems: bom.items,
    machiningOperations,
    operations,
    sections,
    assemblyTree,
    errors: []
  }
}

const isFrameRole = (role = '') => role.startsWith('frame') || role.startsWith('mullion')

const shouldIncludeRole = (role, scope) => {
  if (scope === 'frame_only') return isFrameRole(role)
  if (scope === 'leaf_only') return !isFrameRole(role)
  return true
}

export const compileTechnicalSystemLayout = ({
  system,
  layout,
  label = 'عنصر',
  quantity = 1,
  scope = 'all'
}) => {
  const normalized = normalizeTechnicalSystem(system)
  const layoutWidth = toNumber(layout?.wallWidthM, 0)
  const layoutHeight = toNumber(layout?.wallHeightM, 0)
  const qtyMultiplier = toPositiveInt(quantity, 1)
  const pieces = []
  const glass = []
  const accessories = []
  const operations = []
  const sections = [
    ...((layout?.fixed || []).map((section, index) => ({
      id: section.id ?? `fixed-${index + 1}`,
      label: section.label || `ثابت ${index + 1}`,
      type: 'fixed',
      calcW: toNumber(section.w, 0),
      calcH: toNumber(section.h, 0)
    })) || []),
    ...((layout?.sashes || []).map((section, index) => ({
      id: section.id ?? `sash-${index + 1}`,
      label: section.label || `متحرك ${index + 1}`,
      type: 'sash',
      calcW: toNumber(section.w, 0),
      calcH: toNumber(section.h, 0)
    })) || [])
  ]

  if (layoutWidth <= 0 || layoutHeight <= 0) {
    return {
      normalized,
      pieces,
      glass,
      accessories,
      operations,
      sections,
      errors: ['يرجى إدخال أبعاد صحيحة للتجميعة قبل الحساب.']
    }
  }

  normalized.structuredFormulas.forEach((formula) => {
    const role = formula.physicalRole
    if (!shouldIncludeRole(role, scope)) return

    if (role === 'frame_w' || role === 'frame_h') {
      const baseLength = role === 'frame_w' ? layoutWidth : layoutHeight
      const finalLength = calculateFinalLength(baseLength, formula.divideBy, formula.offsetCm)
      if (finalLength <= 0) return

      pieces.push({
        id: Math.random(),
        profileId: normalized.id,
        inventoryId: formula.inventoryId,
        label: `${label} - ${formula.label || 'قطاع'}`,
        length: finalLength,
        quantity: formula.qty * qtyMultiplier,
        cutType: formula.cutType,
        physicalRole: role,
        miterWasteCm: normalized.miterWasteCm
      })
      return
    }

    if (role === 'mullion_w' || role === 'mullion_h') {
      const mullionLengths =
        role === 'mullion_w' ? layout?.mullionsW || [] : layout?.mullionsH || []

      mullionLengths.forEach((mullionLength, index) => {
        const finalLength = calculateFinalLength(mullionLength, formula.divideBy, formula.offsetCm)
        if (finalLength <= 0) return

        pieces.push({
          id: Math.random(),
          profileId: normalized.id,
          inventoryId: formula.inventoryId,
          label: `${label} - ${formula.label || 'قاطع'} ${index + 1}`,
          length: finalLength,
          quantity: formula.qty * qtyMultiplier,
          cutType: formula.cutType,
          physicalRole: role,
          miterWasteCm: normalized.miterWasteCm
        })
      })
      return
    }

    sections.forEach((section, index) => {
      if (!roleMatchesSection(role, section.type)) return

      const baseLength = role.endsWith('_w') ? section.calcW : section.calcH
      const finalLength = calculateFinalLength(baseLength, formula.divideBy, formula.offsetCm)
      if (finalLength <= 0) return

      pieces.push({
        id: Math.random(),
        profileId: normalized.id,
        inventoryId: formula.inventoryId,
        label: `${label} - ${section.label || `${section.type === 'fixed' ? 'ثابت' : 'متحرك'} ${index + 1}`} - ${formula.label || 'قطاع'}`,
        length: finalLength,
        quantity: formula.qty * qtyMultiplier,
        cutType: formula.cutType,
        physicalRole: role,
        miterWasteCm: normalized.miterWasteCm
      })
    })
  })

  if (scope !== 'frame_only') {
    normalized.glassFormulas.forEach((formula) => {
      sections.forEach((section, index) => {
        if (!roleMatchesSection(formula.physicalRole, section.type)) return

        const widthValue = calculateFinalLength(section.calcW, formula.divideW, formula.offsetW)
        const heightValue = calculateFinalLength(section.calcH, formula.divideH, formula.offsetH)

        if (widthValue > 0 && heightValue > 0) {
          glass.push({
            id: Math.random(),
            profileId: normalized.id,
            inventoryId: formula.inventoryId,
            label: `${label} - ${section.label || `${section.type === 'fixed' ? 'ثابت' : 'متحرك'} ${index + 1}`} - ${formula.label || 'زجاج'}`,
            w: widthValue,
            h: heightValue,
            quantity: formula.qty * qtyMultiplier,
            physicalRole: formula.physicalRole
          })
        }
      })
    })

    normalized.accessories.forEach((accessory) => {
      const baseMeasure = calculateAccessoryBaseMeasure(accessory, {
        width: layoutWidth,
        height: layoutHeight,
        sections
      })
      const finalQty = Number((accessory.qtyPerWindow * baseMeasure * qtyMultiplier).toFixed(3))
      if (finalQty <= 0) return

      accessories.push({
        id: Math.random(),
        profileId: normalized.id,
        inventoryId: accessory.inventoryId,
        name: buildAccessoryLabel(accessory),
        quantity: finalQty,
        sectionType: accessory.sectionType,
        calcMode: accessory.calcMode
      })
    })

    normalized.workshopOperations.forEach((operation) => {
      const baseMeasure = calculateAccessoryBaseMeasure(operation, {
        width: layoutWidth,
        height: layoutHeight,
        sections
      })
      const quantityValue = Number((operation.qtyFactor * baseMeasure * qtyMultiplier).toFixed(3))
      if (quantityValue <= 0) return

      operations.push({
        id: Math.random(),
        profileId: normalized.id,
        name: buildOperationLabel(operation),
        category: operation.category,
        quantity: quantityValue,
        unitLabel: operation.unitLabel,
        calcMode: operation.calcMode,
        sectionType: operation.sectionType,
        costPerUnit: operation.costPerUnit,
        totalCost: Number((quantityValue * operation.costPerUnit).toFixed(3)),
        notes: operation.notes
      })
    })
  }

  return {
    normalized,
    pieces,
    glass,
    accessories,
    operations,
    sections,
    errors: []
  }
}
