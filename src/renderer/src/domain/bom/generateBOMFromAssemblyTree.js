import { asArray } from '../shared/guards.js'
import { ProfileCutRulesEngine } from '../rules/cutting/ProfileCutRulesEngine.js'
import { createDefaultProfileCutRules } from '../rules/fixtures/defaultCutRules.js'
import { BOMItem } from './BOMItem.js'

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const round3 = (value) => Number(toNumber(value, 0).toFixed(3))

const normalizeToken = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()

const calculateFinalLength = (baseLength, divideBy, offsetCm, forceSingle = false) => {
  const safeBase = toNumber(baseLength, 0)
  if (safeBase <= 0) return 0
  const divisor = forceSingle ? 1 : Math.max(1, Math.floor(toNumber(divideBy, 1)))
  const finalValue = safeBase / divisor + toNumber(offsetCm, 0) / 100
  return finalValue > 0 ? round3(finalValue) : 0
}

const nodePartTypeToBomKind = (partType) => {
  if (partType === 'profile_piece') return 'profile'
  if (partType === 'glass') return 'glass'
  if (partType === 'gasket') return 'gasket'
  if (partType === 'hinge') return 'hinge'
  if (partType === 'lock') return 'lock'
  return 'accessory'
}

const roleBelongsToSection = (role, sectionType) => {
  if (!role) return false
  if (sectionType === 'fixed') return role.includes('fixed')
  return role.includes('sash')
}

const buildFormulaMap = (items = []) =>
  new Map(
    asArray(items)
      .filter((item) => item && item.id !== undefined && item.id !== null)
      .map((item) => [String(item.id), item])
  )

const buildSectionLabelSuffix = (sectionContext, configuredElement) => {
  if (!sectionContext) return ''
  const sectionsCount = asArray(configuredElement?.sections).length
  if (sectionsCount <= 1) return ''
  const index = Number(sectionContext.index)
  if (Number.isFinite(index) && index >= 0) return ` (section ${index + 1})`
  if (sectionContext.sectionId) return ` (section ${sectionContext.sectionId})`
  return ''
}

const walkNodes = (node, context, visitFn) => {
  if (!node) return

  const nextContext = { ...context }
  if (node.partType === 'sash' || node.partType === 'fixed_panel') {
    nextContext.section = {
      sectionId: node.metadata?.sectionId || '',
      index: node.metadata?.index,
      sectionType: node.metadata?.sectionType || (node.partType === 'sash' ? 'sash' : 'fixed'),
      widthM: toNumber(node.metadata?.widthM, toNumber(context.configuredElement?.widthM, 0)),
      heightM: toNumber(node.metadata?.heightM, toNumber(context.configuredElement?.heightM, 0))
    }
  }

  visitFn(node, nextContext)
  asArray(node.children).forEach((child) => walkNodes(child, nextContext, visitFn))
}

const buildProfileRow = ({
  node,
  context,
  formula,
  role,
  cutRulesEngine,
  profileId,
  configuredElement,
  miterWasteCm
}) => {
  const width = toNumber(configuredElement.widthM, 0)
  const height = toNumber(configuredElement.heightM, 0)
  const sectionContext = context.section || null
  const sectionWidth = toNumber(sectionContext?.widthM, width)
  const sectionHeight = toNumber(sectionContext?.heightM, height)

  const forceSingleFixed =
    asArray(configuredElement.sections).length <= 1 &&
    (sectionContext?.sectionType ||
      asArray(configuredElement.sections)[0]?.type ||
      configuredElement.systemType) === 'fixed'

  if (sectionContext && !role.startsWith('frame') && !role.startsWith('mullion')) {
    if (!roleBelongsToSection(role, sectionContext.sectionType)) return null
  }

  const cutCalc = cutRulesEngine.calculateProfileCut({
    physicalRole: role,
    formula: {
      divideBy: formula?.divideBy ?? node.metadata?.divideBy ?? 1,
      offsetCm: formula?.offsetCm ?? 0,
      cutType: formula?.cutType || node.metadata?.cutType || '90'
    },
    elementWidthM: width,
    elementHeightM: height,
    sectionWidthM: sectionWidth,
    sectionHeightM: sectionHeight,
    forceSingle: forceSingleFixed
  })
  const finalLength = cutCalc?.finalLengthM || 0
  const quantity = round3(node.quantity)

  if (!cutCalc || finalLength <= 0 || quantity <= 0) return null

  const elementLabel = configuredElement.label || 'Configured element'
  const sectionSuffix = buildSectionLabelSuffix(sectionContext, configuredElement)
  const pieceLabel = `${elementLabel}${sectionSuffix} - ${formula?.label || node.label || 'Profile piece'}`

  return {
    id: `${node.id}-piece`,
    profileId,
    inventoryId: formula?.inventoryId || node.metadata?.inventoryId || '',
    label: pieceLabel,
    length: finalLength,
    quantity,
    cutType: cutCalc.cutType,
    physicalRole: role,
    sectionId: sectionContext?.sectionId || '',
    sectionType: sectionContext?.sectionType || 'all',
    sectionWidthM: sectionWidth,
    sectionHeightM: sectionHeight,
    elementWidthM: width,
    elementHeightM: height,
    miterWasteCm,
    cutRuleId: cutCalc.ruleId,
    jointAssumption: cutCalc.jointAssumption,
    deductionsCm: {
      left: cutCalc.leftDeductionCm,
      right: cutCalc.rightDeductionCm
    },
    cutBaseLengthM: cutCalc.baseLengthM,
    cutDividedLengthM: cutCalc.dividedLengthM
  }
}

const buildGlassRow = ({ node, context, formula, configuredElement }) => {
  const sectionContext = context.section || null
  const sections = asArray(configuredElement.sections)
  const fallbackSection = sections[0] || null

  const targetSection = sectionContext || {
    sectionType: fallbackSection?.type || configuredElement.systemType || 'sash',
    widthM: toNumber(fallbackSection?.widthM, configuredElement.widthM),
    heightM: toNumber(fallbackSection?.heightM, configuredElement.heightM),
    index: fallbackSection?.index,
    sectionId: fallbackSection?.id
  }

  const role = formula?.physicalRole || node.metadata?.physicalRole || ''
  if (!roleBelongsToSection(role, targetSection.sectionType)) return null

  const forceSingleFixed =
    sections.length <= 1 && String(targetSection.sectionType || '').toLowerCase() === 'fixed'

  const width = calculateFinalLength(
    targetSection.widthM,
    formula?.divideW ?? 1,
    formula?.offsetW ?? 0,
    forceSingleFixed
  )
  const height = calculateFinalLength(
    targetSection.heightM,
    formula?.divideH ?? 1,
    formula?.offsetH ?? 0,
    forceSingleFixed
  )
  const quantity = round3(node.quantity)
  if (width <= 0 || height <= 0 || quantity <= 0) return null

  const elementLabel = configuredElement.label || 'Configured element'
  const sectionSuffix = buildSectionLabelSuffix(targetSection, configuredElement)

  return {
    id: `${node.id}-glass`,
    profileId: configuredElement.systemId || '',
    inventoryId: formula?.inventoryId || node.metadata?.inventoryId || '',
    label: `${elementLabel}${sectionSuffix} - ${formula?.label || node.label || 'Glass'}`,
    w: width,
    h: height,
    quantity,
    physicalRole: role
  }
}

const buildAccessoryRow = ({ node, context, accessorySource, configuredElement }) => {
  const quantity = round3(node.quantity)
  if (quantity <= 0) return null

  const sectionType =
    node.metadata?.sectionType || accessorySource?.sectionType || context.section?.sectionType || 'all'
  const calcMode = node.metadata?.calcMode || accessorySource?.calcMode || 'per_opening'
  const accessoryKind =
    node.partType === 'accessory'
      ? node.metadata?.accessoryKind || 'generic'
      : normalizeToken(node.partType)

  return {
    id: `${node.id}-accessory`,
    profileId: configuredElement.systemId || '',
    inventoryId: node.metadata?.inventoryId || accessorySource?.inventoryId || '',
    name: node.label || accessorySource?.name || 'Accessory',
    quantity,
    sectionType,
    sectionId: context.section?.sectionId || '',
    sectionWidthM: toNumber(context.section?.widthM, toNumber(configuredElement.widthM, 0)),
    sectionHeightM: toNumber(context.section?.heightM, toNumber(configuredElement.heightM, 0)),
    elementWidthM: toNumber(configuredElement.widthM, 0),
    elementHeightM: toNumber(configuredElement.heightM, 0),
    calcMode,
    accessoryKind
  }
}

const toAssemblyTreeJson = (assemblyTree) => {
  if (!assemblyTree) return null
  if (typeof assemblyTree.toJSON === 'function') return assemblyTree.toJSON()
  if (assemblyTree.root && assemblyTree.configuredElement) return assemblyTree
  return null
}

export const generateBOMFromAssemblyTree = ({ assemblyTree, system = {} }) => {
  const tree = toAssemblyTreeJson(assemblyTree)
  if (!tree) {
    return {
      items: [],
      pieces: [],
      glass: [],
      accessories: []
    }
  }

  const configuredElement = tree.configuredElement || {}
  const profileId = system.id || configuredElement.systemId || ''
  const miterWasteCm = toNumber(system.miterWasteCm, 6.5)
  const cutRulesEngine = new ProfileCutRulesEngine(createDefaultProfileCutRules(system.physics))
  const structuredFormulaMap = buildFormulaMap(system.structuredFormulas)
  const glassFormulaMap = buildFormulaMap(system.glassFormulas)
  const accessoryMap = buildFormulaMap(system.accessories)

  const items = []
  const pieces = []
  const glass = []
  const accessories = []

  walkNodes(
    tree.root,
    { configuredElement, section: null },
    (node, context) => {
      const sourceId = String(node.sourceRef?.sourceId || '')

      if (node.partType === 'profile_piece') {
        const formula = structuredFormulaMap.get(sourceId)
        const role = formula?.physicalRole || node.metadata?.physicalRole || ''
        const piece = buildProfileRow({
          node,
          context,
          formula,
          role,
          cutRulesEngine,
          profileId,
          configuredElement,
          miterWasteCm
        })
        if (!piece) return

        pieces.push(piece)
        items.push(
          new BOMItem({
            id: `${piece.id}-bom`,
            kind: nodePartTypeToBomKind(node.partType),
            label: piece.label,
            quantity: piece.quantity,
            inventoryId: piece.inventoryId,
            sourceNodeId: node.id,
            metadata: {
              profileId,
              lengthM: piece.length,
              cutType: piece.cutType,
              cutRuleId: piece.cutRuleId,
              jointAssumption: piece.jointAssumption,
              leftDeductionCm: piece.deductionsCm.left,
              rightDeductionCm: piece.deductionsCm.right,
              cutBaseLengthM: piece.cutBaseLengthM,
              cutDividedLengthM: piece.cutDividedLengthM,
              physicalRole: piece.physicalRole,
              miterWasteCm: piece.miterWasteCm
            }
          })
        )
        return
      }

      if (node.partType === 'glass') {
        const formula = glassFormulaMap.get(sourceId)
        const glassRow = buildGlassRow({ node, context, formula, configuredElement })
        if (!glassRow) return

        glass.push(glassRow)
        items.push(
          new BOMItem({
            id: `${glassRow.id}-bom`,
            kind: nodePartTypeToBomKind(node.partType),
            label: glassRow.label,
            quantity: glassRow.quantity,
            inventoryId: glassRow.inventoryId,
            sourceNodeId: node.id,
            metadata: {
              profileId,
              widthM: glassRow.w,
              heightM: glassRow.h,
              physicalRole: glassRow.physicalRole
            }
          })
        )
        return
      }

      if (['gasket', 'hinge', 'lock', 'accessory'].includes(node.partType)) {
        const accessorySource = accessoryMap.get(sourceId)
        const accessoryRow = buildAccessoryRow({
          node,
          context,
          accessorySource,
          configuredElement
        })
        if (!accessoryRow) return

        accessories.push(accessoryRow)
        items.push(
          new BOMItem({
            id: `${accessoryRow.id}-bom`,
            kind: nodePartTypeToBomKind(node.partType),
            label: accessoryRow.name,
            quantity: accessoryRow.quantity,
            inventoryId: accessoryRow.inventoryId,
            sourceNodeId: node.id,
            metadata: {
              profileId,
              accessoryKind: accessoryRow.accessoryKind,
              sectionType: accessoryRow.sectionType,
              calcMode: accessoryRow.calcMode
            }
          })
        )
      }
    }
  )

  return {
    items: items.map((item) => item.toJSON()),
    pieces,
    glass,
    accessories
  }
}
