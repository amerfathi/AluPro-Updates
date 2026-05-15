import { asArray } from '../shared/guards.js'
import { createDefaultMachiningTemplates } from './defaultMachiningTemplates.js'
import { MachiningTemplate } from './MachiningTemplate.js'

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const round3 = (value) => Number(toNumber(value, 0).toFixed(3))

const evaluateFormulaValue = (formulaOrNumber, metrics = {}, fallback = 0) => {
  if (typeof formulaOrNumber === 'number') return formulaOrNumber
  if (!formulaOrNumber || typeof formulaOrNumber !== 'object') return fallback

  const metric = String(formulaOrNumber.metric || '')
  const operator = String(formulaOrNumber.operator || 'set')
  const value = toNumber(formulaOrNumber.value, 0)
  const metricValue = toNumber(metrics[metric], 0)

  if (operator === 'set') return metricValue
  if (operator === 'add') return metricValue + value
  if (operator === 'subtract') return metricValue - value
  if (operator === 'multiply') return metricValue * value
  if (operator === 'divide') return value === 0 ? metricValue : metricValue / value
  return fallback
}

const resolveAnchorValue = (anchor, span, axis) => {
  const normalized = String(anchor || (axis === 'x' ? 'left' : 'top')).toLowerCase()
  if (normalized === 'center') return span / 2
  if (axis === 'x' && normalized === 'right') return span
  if (axis === 'y' && normalized === 'bottom') return span
  return 0
}

const buildMetrics = ({ source, configuredElement = {} }) => {
  const elementWidthMm = toNumber(source?.elementWidthM, toNumber(configuredElement.widthM, 0)) * 1000
  const elementHeightMm =
    toNumber(source?.elementHeightM, toNumber(configuredElement.heightM, 0)) * 1000
  const sectionWidthMm = toNumber(source?.sectionWidthM, toNumber(source?.length, 0)) * 1000
  const sectionHeightMm = toNumber(source?.sectionHeightM, toNumber(configuredElement.heightM, 0)) * 1000
  const pieceLengthMm = toNumber(source?.length, 0) * 1000

  return {
    element_width_mm: elementWidthMm,
    element_height_mm: elementHeightMm,
    section_width_mm: sectionWidthMm || elementWidthMm,
    section_height_mm: sectionHeightMm || elementHeightMm,
    piece_length_mm: pieceLengthMm
  }
}

const resolveQuantity = (template, sourceQuantity) => {
  const multiplier = toNumber(template.quantityModel.multiplier, 1)
  if (template.quantityModel.mode === 'fixed') return round3(multiplier)
  return round3(toNumber(sourceQuantity, 0) * multiplier)
}

const normalizeTemplates = (templates = []) =>
  asArray(templates).map((template, index) =>
    template instanceof MachiningTemplate
      ? template
      : new MachiningTemplate({
          id: template?.id || `machining-template-${index + 1}`,
          ...template
        })
  )

export const generateMachiningOperations = ({
  system = {},
  bom = {},
  assemblyTree = null,
  templates = null
}) => {
  const configuredElement = assemblyTree?.configuredElement || {}
  const resolvedTemplates = normalizeTemplates(
    templates && templates.length ? templates : createDefaultMachiningTemplates()
  )

  const accessorySources = asArray(bom.accessories).map((source) => ({
    ...source,
    sourceType: 'accessory',
    targetType: 'accessory_kind'
  }))
  const profileSources = asArray(bom.pieces).map((source) => ({
    ...source,
    sourceType: 'profile',
    targetType: 'profile_role'
  }))

  const allSources = [...accessorySources, ...profileSources]

  const operations = []

  allSources.forEach((source, sourceIndex) => {
    const metrics = buildMetrics({ source, configuredElement })
    const sectionWidthMm = metrics.section_width_mm
    const sectionHeightMm = metrics.section_height_mm

    resolvedTemplates.forEach((template) => {
      if (!template.matchesSource(source)) return

      const quantity = resolveQuantity(template, source.quantity)
      if (quantity <= 0) return

      const xBase = resolveAnchorValue(template.referencePoint.xAnchor, sectionWidthMm, 'x')
      const yBase = resolveAnchorValue(template.referencePoint.yAnchor, sectionHeightMm, 'y')

      const xOffsetMm = evaluateFormulaValue(template.referencePoint.xOffsetMm, metrics, 0)
      const yOffsetMm = evaluateFormulaValue(template.referencePoint.yOffsetMm, metrics, 0)

      const referencePointMm = {
        x: round3(xBase + xOffsetMm),
        y: round3(yBase + yOffsetMm),
        xAnchor: template.referencePoint.xAnchor,
        yAnchor: template.referencePoint.yAnchor
      }

      const operationId = `${template.id}-${source.sourceType}-${sourceIndex + 1}`
      const sourceLabel = source.name || source.label || source.physicalRole || source.accessoryKind

      operations.push({
        id: operationId,
        profileId: source.profileId || system.id || '',
        name: `${template.name} - ${sourceLabel}`,
        category: 'machining',
        quantity,
        unitLabel: 'operation',
        calcMode: 'per_opening',
        sectionType: source.sectionType || 'all',
        costPerUnit: 0,
        totalCost: 0,
        notes: template.notes || '',
        machining: {
          templateId: template.id,
          operationCode: template.operationCode,
          sourceType: source.sourceType,
          sourceInventoryId: source.inventoryId || '',
          sourceRole: source.physicalRole || '',
          sourceAccessoryKind: source.accessoryKind || '',
          referencePointMm,
          formulaMetrics: metrics,
          holePattern: {
            holesPerOperation: template.holePattern.holesPerOperation,
            spacingMm: template.holePattern.spacingMm
          }
        }
      })
    })
  })

  return operations
}
