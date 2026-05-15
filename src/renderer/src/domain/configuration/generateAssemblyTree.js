import { asArray } from '../shared/guards.js'
import { createConfiguredElementFromTechnicalInput } from '../adapters/fromTechnicalSystemConfig.js'
import { createDefaultAssemblyRules } from '../rules/fixtures/defaultAssemblyRules.js'
import { AssemblyPartNode, AssemblyTree } from './AssemblyTree.js'

const normalizeToken = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()

const classifyAccessoryKind = (accessoryName = '', inventoryName = '') => {
  const token = `${accessoryName} ${inventoryName}`.trim().toLowerCase()
  if (!token) return 'generic'

  if (
    ['gasket', 'كاوتش', 'جلدة', 'rubber', 'weather strip'].some((entry) => token.includes(entry))
  ) {
    return 'gasket'
  }
  if (['hinge', 'مفصلة', 'مفصلات', 'كباس'].some((entry) => token.includes(entry))) {
    return 'hinge'
  }
  if (
    ['lock', 'قفل', 'كالون', 'مزلاج', 'handle', 'مسكة', 'مقبض'].some((entry) =>
      token.includes(entry)
    )
  ) {
    return 'lock'
  }
  return 'generic'
}

const shouldApplyToSection = (entrySectionType, sectionType) => {
  const normalizedEntry = normalizeToken(entrySectionType || 'all')
  if (normalizedEntry === 'all') return true
  return normalizedEntry === normalizeToken(sectionType)
}

const getTargetContainers = ({
  rule,
  sectionNodes,
  frameNode,
  rootNode,
  entrySectionType = 'all'
}) => {
  if (rule.attachTo === 'root') return [rootNode]
  if (rule.attachTo === 'frame') return [frameNode]
  if (rule.attachTo === 'sash') return sectionNodes.filter((node) => node.sectionType === 'sash')
  if (rule.attachTo === 'fixed_panel')
    return sectionNodes.filter((node) => node.sectionType === 'fixed')
  if (rule.attachTo === 'section') {
    return sectionNodes.filter((node) => shouldApplyToSection(entrySectionType, node.sectionType))
  }
  return [rootNode]
}

const resolveAccessoryQuantity = ({ accessory, configuredElement, targetSections }) => {
  const baseQty = Number(accessory.qtyPerWindow || 0)
  const quantityMultiplier = Number(configuredElement.quantity || 1)
  if (!Number.isFinite(baseQty) || baseQty <= 0) return 0

  const mode = normalizeToken(accessory.calcMode || 'per_opening')
  if (mode === 'per_section')
    return baseQty * Math.max(targetSections.length, 1) * quantityMultiplier
  if (mode === 'per_meter_width') {
    const meterWidth = targetSections.reduce(
      (total, section) => total + Number(section.widthM || 0),
      0
    )
    return baseQty * (meterWidth || Number(configuredElement.widthM || 0)) * quantityMultiplier
  }
  if (mode === 'per_meter_height') {
    const meterHeight = targetSections.reduce(
      (total, section) => total + Number(section.heightM || 0),
      0
    )
    return baseQty * (meterHeight || Number(configuredElement.heightM || 0)) * quantityMultiplier
  }
  if (mode === 'per_perimeter') {
    const perimeter = targetSections.reduce(
      (total, section) => total + 2 * (Number(section.widthM || 0) + Number(section.heightM || 0)),
      0
    )
    return (
      baseQty *
      (perimeter || 2 * (configuredElement.widthM + configuredElement.heightM)) *
      quantityMultiplier
    )
  }
  if (mode === 'per_area') {
    const area = targetSections.reduce(
      (total, section) => total + Number(section.widthM || 0) * Number(section.heightM || 0),
      0
    )
    return (
      baseQty * (area || configuredElement.widthM * configuredElement.heightM) * quantityMultiplier
    )
  }
  return baseQty * quantityMultiplier
}

const resolveFormulaQuantity = (formulaQty, configuredElementQuantity, multiplier = 1) => {
  const normalizedFormulaQty = Number(formulaQty || 0)
  const normalizedElementQty = Number(configuredElementQuantity || 1)
  const normalizedMultiplier = Number(multiplier || 0)
  if (!Number.isFinite(normalizedFormulaQty) || normalizedFormulaQty <= 0) return 0
  if (!Number.isFinite(normalizedElementQty) || normalizedElementQty <= 0)
    return normalizedFormulaQty * Math.max(normalizedMultiplier, 0)
  if (!Number.isFinite(normalizedMultiplier) || normalizedMultiplier <= 0) return 0
  return normalizedFormulaQty * normalizedElementQty * normalizedMultiplier
}

const resolveFormulaQuantityMultiplier = ({ entry, configuredElement }) => {
  const role = normalizeToken(entry?.physicalRole)
  if (role.startsWith('mullion')) {
    return Math.max(0, Number(configuredElement.sections?.length || 0) - 1)
  }
  return 1
}

const buildFormulaNode = ({
  rule,
  entry,
  configuredElement,
  containerId,
  index,
  quantityMultiplier = 1
}) => {
  const quantity = resolveFormulaQuantity(entry.qty, configuredElement.quantity, quantityMultiplier)
  if (quantity <= 0) return null

  return new AssemblyPartNode({
    id: `${containerId}-${rule.id}-${entry.id || index + 1}`,
    partType: rule.nodeType,
    label: entry.label || rule.name,
    quantity,
    sourceRef: {
      source: rule.source,
      sourceId: String(entry.id || index + 1)
    },
    metadata: {
      physicalRole: entry.physicalRole || '',
      inventoryId: entry.inventoryId || '',
      cutType: entry.cutType || '',
      divideBy: entry.divideBy || 1
    }
  })
}

const buildAccessoryNode = ({
  rule,
  accessory,
  configuredElement,
  targetSectionNodes,
  inventoryItem,
  containerId,
  index
}) => {
  const quantity = resolveAccessoryQuantity({
    accessory,
    configuredElement,
    targetSections: targetSectionNodes
  })

  if (quantity <= 0) return null

  return new AssemblyPartNode({
    id: `${containerId}-${rule.id}-${accessory.id || index + 1}`,
    partType: rule.nodeType,
    label: accessory.name || inventoryItem?.name || rule.name,
    quantity,
    sourceRef: {
      source: rule.source,
      sourceId: String(accessory.id || index + 1)
    },
    metadata: {
      inventoryId: accessory.inventoryId || '',
      accessoryKind: classifyAccessoryKind(accessory.name, inventoryItem?.name),
      sectionType: accessory.sectionType || 'all',
      calcMode: accessory.calcMode || 'per_opening'
    }
  })
}

const buildSectionContainers = (configuredElement, rootId) =>
  configuredElement.sections.map((section) => ({
    id: `${rootId}-section-${section.id}`,
    sectionId: section.id,
    sectionType: section.type,
    widthM: section.widthM,
    heightM: section.heightM,
    children: []
  }))

const createSectionNode = (sectionContainer) =>
  new AssemblyPartNode({
    id: sectionContainer.id,
    partType: sectionContainer.sectionType === 'fixed' ? 'fixed_panel' : 'sash',
    label:
      sectionContainer.sectionType === 'fixed'
        ? `Fixed section ${sectionContainer.sectionId}`
        : `Sash section ${sectionContainer.sectionId}`,
    quantity: 1,
    metadata: {
      sectionId: sectionContainer.sectionId,
      sectionType: sectionContainer.sectionType,
      widthM: sectionContainer.widthM,
      heightM: sectionContainer.heightM
    },
    children: sectionContainer.children
  })

export const generateAssemblyTreeForTechnicalWindow = ({
  system,
  opening,
  width,
  height,
  quantity,
  sections,
  inventory = [],
  rules = createDefaultAssemblyRules()
}) => {
  const configuredElement = createConfiguredElementFromTechnicalInput({
    system,
    opening,
    width,
    height,
    quantity,
    sections
  })
  const inventoryMap = new Map(asArray(inventory).map((item) => [item.id, item]))

  const rootId = `${configuredElement.id}-assembly`
  const frameContainer = { id: `${rootId}-frame`, children: [] }
  const sectionContainers = buildSectionContainers(configuredElement, rootId)
  const mappedAccessoryEntries = new Set()

  const sortedRules = [...rules].sort((left, right) => left.priority - right.priority)

  sortedRules.forEach((rule) => {
    const sourceEntries = asArray(system?.[rule.source])
    sourceEntries.forEach((entry, index) => {
      const entrySourceId = String(entry?.id || index + 1)
      if (rule.source === 'accessories' && mappedAccessoryEntries.has(entrySourceId)) return

      const accessoryKind =
        rule.source === 'accessories'
          ? classifyAccessoryKind(entry?.name, inventoryMap.get(entry?.inventoryId)?.name)
          : null

      const potentialTargets = getTargetContainers({
        rule,
        sectionNodes: sectionContainers,
        frameNode: frameContainer,
        rootNode: { id: rootId, sectionType: 'all', children: [] },
        entrySectionType: entry?.sectionType || 'all'
      })

      const selectedTargets =
        rule.source === 'accessories' && potentialTargets.length > 1
          ? [potentialTargets[0]]
          : potentialTargets

      selectedTargets.forEach((target) => {
        const context = {
          targetSectionType: target.sectionType || 'all',
          accessoryKind
        }
        if (!rule.matchesEntry(entry, context)) return

        if (rule.source === 'accessories') {
          const relatedSections = sectionContainers.filter((section) =>
            shouldApplyToSection(entry?.sectionType || 'all', section.sectionType)
          )
          const node = buildAccessoryNode({
            rule,
            accessory: entry,
            configuredElement,
            targetSectionNodes: relatedSections,
            inventoryItem: inventoryMap.get(entry?.inventoryId),
            containerId: target.id,
            index
          })
          if (node) {
            target.children.push(node)
            mappedAccessoryEntries.add(entrySourceId)
          }
          return
        }

        const node = buildFormulaNode({
          rule,
          entry,
          configuredElement,
          containerId: target.id,
          index,
          quantityMultiplier: resolveFormulaQuantityMultiplier({
            entry,
            configuredElement
          })
        })
        if (node) target.children.push(node)
      })
    })
  })

  const rootNode = new AssemblyPartNode({
    id: rootId,
    partType: 'element',
    label: configuredElement.label || 'Configured element',
    quantity: configuredElement.quantity,
    metadata: {
      systemId: configuredElement.systemId,
      systemType: configuredElement.systemType,
      widthM: configuredElement.widthM,
      heightM: configuredElement.heightM,
      sashType: configuredElement.sashType,
      openingDirection: configuredElement.openingDirection
    },
    children: [
      new AssemblyPartNode({
        id: frameContainer.id,
        partType: 'frame',
        label: 'Frame',
        quantity: configuredElement.quantity,
        children: frameContainer.children
      }),
      ...sectionContainers.map((section) => createSectionNode(section))
    ]
  })

  return new AssemblyTree({
    id: rootId,
    configuredElement,
    root: rootNode,
    metadata: {
      source: 'technical-system-mvp-generator',
      rulesApplied: sortedRules.map((rule) => rule.id)
    }
  })
}
