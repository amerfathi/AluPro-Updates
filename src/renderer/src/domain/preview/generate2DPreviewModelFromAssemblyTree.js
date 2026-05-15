import { asArray } from '../shared/guards.js'

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const round3 = (value) => Number(toNumber(value, 0).toFixed(3))
const round1 = (value) => Number(toNumber(value, 0).toFixed(1))

const toAssemblyTreeJson = (assemblyTree) => {
  if (!assemblyTree) return null
  if (typeof assemblyTree.toJSON === 'function') return assemblyTree.toJSON()
  if (assemblyTree.root && assemblyTree.configuredElement) return assemblyTree
  return null
}

const flattenNodes = (node, collector = []) => {
  if (!node) return collector
  collector.push(node)
  asArray(node.children).forEach((child) => flattenNodes(child, collector))
  return collector
}

const findNodesByPartType = (tree, partType) =>
  flattenNodes(tree?.root, []).filter((node) => node.partType === partType)

const createProfileBlock = ({ profileId, profileName, profileSystemType, profileGeometryCatalog }) => {
  const geometry = profileGeometryCatalog.get(String(profileId || ''))

  return {
    id: String(profileId || ''),
    name: String(profileName || ''),
    systemType: String(profileSystemType || ''),
    geometry: geometry
      ? {
          id: geometry.id,
          zones: geometry.zones.map((zone) => zone.id),
          depthMm: geometry.depthMm,
          wallThicknessMm: geometry.wallThicknessMm
        }
      : null
  }
}

export const generate2DPreviewModelFromAssemblyTree = ({
  assemblyTree,
  profileGeometryCatalog = new Map()
}) => {
  const tree = toAssemblyTreeJson(assemblyTree)
  if (!tree) return null

  const configuredElement = tree.configuredElement || {}
  const wallWidth = toNumber(configuredElement.widthM, 0)
  const wallHeight = toNumber(configuredElement.heightM, 0)
  if (wallWidth <= 0 || wallHeight <= 0) return null

  const sectionNodes = [
    ...findNodesByPartType(tree, 'sash'),
    ...findNodesByPartType(tree, 'fixed_panel')
  ]
  const frameNode = findNodesByPartType(tree, 'frame')[0] || null
  const rules = tree.metadata?.configurationRules || {}
  const mullionSegments = rules.mullionSegments || {}

  const modules = sectionNodes.map((node, index) => {
    const metadata = node.metadata || {}
    const sectionType = metadata.sectionType || (node.partType === 'fixed_panel' ? 'fixed' : 'sash')
    const widthM = toNumber(metadata.widthM, 0)
    const heightM = toNumber(metadata.heightM, 0)

    return {
      id: node.id,
      sectionId: metadata.sectionId || `section-${index + 1}`,
      type: sectionType,
      label: node.label || `Section ${index + 1}`,
      xM: round3(metadata.xM),
      yM: round3(metadata.yM),
      widthM: round3(widthM),
      heightM: round3(heightM),
      row: metadata.row,
      col: metadata.col,
      rowSpan: metadata.rowSpan,
      colSpan: metadata.colSpan,
      profile: createProfileBlock({
        profileId: metadata.profileId,
        profileName: metadata.profileName,
        profileSystemType: metadata.profileSystemType,
        profileGeometryCatalog
      })
    }
  })

  const frameProfile = createProfileBlock({
    profileId: frameNode?.metadata?.profileId || configuredElement.systemId,
    profileName: frameNode?.metadata?.profileName || '',
    profileSystemType: frameNode?.metadata?.profileSystemType || configuredElement.systemType,
    profileGeometryCatalog
  })

  const structuralPieces = [
    {
      id: 'frame-top',
      label: 'Frame top',
      orientation: 'horizontal',
      length: round3(wallWidth),
      start: 0,
      end: round3(wallWidth),
      offset: 0,
      systemName: frameProfile.name
    },
    {
      id: 'frame-bottom',
      label: 'Frame bottom',
      orientation: 'horizontal',
      length: round3(wallWidth),
      start: 0,
      end: round3(wallWidth),
      offset: round3(wallHeight),
      systemName: frameProfile.name
    },
    {
      id: 'frame-right',
      label: 'Frame right',
      orientation: 'vertical',
      length: round3(wallHeight),
      start: 0,
      end: round3(wallHeight),
      offset: 0,
      systemName: frameProfile.name
    },
    {
      id: 'frame-left',
      label: 'Frame left',
      orientation: 'vertical',
      length: round3(wallHeight),
      start: 0,
      end: round3(wallHeight),
      offset: round3(wallWidth),
      systemName: frameProfile.name
    },
    ...asArray(mullionSegments.vertical).map((segment, index) => ({
      id: `mullion-v-${index + 1}`,
      label: `Vertical mullion ${index + 1}`,
      orientation: 'vertical',
      length: round3(segment.length),
      start: round3(segment.start),
      end: round3(segment.end),
      offset: round3(segment.x),
      systemName: frameProfile.name
    })),
    ...asArray(mullionSegments.horizontal).map((segment, index) => ({
      id: `mullion-h-${index + 1}`,
      label: `Horizontal mullion ${index + 1}`,
      orientation: 'horizontal',
      length: round3(segment.length),
      start: round3(segment.start),
      end: round3(segment.end),
      offset: round3(segment.y),
      systemName: frameProfile.name
    }))
  ]

  const modulesArea = modules.reduce(
    (total, module) => total + toNumber(module.widthM, 0) * toNumber(module.heightM, 0),
    0
  )
  const coveragePercent = round1(
    toNumber(rules.coveragePercent, (modulesArea / Math.max(wallWidth * wallHeight, 1)) * 100)
  )

  return {
    id: `preview-${tree.id}`,
    version: '2d-mvp',
    source: 'domain-assembly-tree',
    canvas: {
      widthM: wallWidth,
      heightM: wallHeight
    },
    frameProfile,
    modules,
    mullions: {
      vertical: asArray(mullionSegments.vertical),
      horizontal: asArray(mullionSegments.horizontal)
    },
    structuralPieces,
    metrics: {
      modulesCount: modules.length,
      fixedCount: modules.filter((module) => module.type === 'fixed').length,
      sashCount: modules.filter((module) => module.type === 'sash').length,
      coveragePercent
    },
    configurationRules: {
      rows: asArray(rules.rows),
      columns: asArray(rules.columns)
    },
    metadata: {
      assemblyTreeId: tree.id,
      configuredElementId: configuredElement.id || ''
    }
  }
}

export const adapt2DPreviewModelToLegacyVisualModel = (previewModel) => {
  if (!previewModel) return null

  return {
    wallWidth: toNumber(previewModel.canvas?.widthM, 0),
    wallHeight: toNumber(previewModel.canvas?.heightM, 0),
    modules: asArray(previewModel.modules).map((module) => ({
      id: module.id,
      type: module.type,
      label: module.label,
      x: toNumber(module.xM, 0),
      y: toNumber(module.yM, 0),
      w: toNumber(module.widthM, 0),
      h: toNumber(module.heightM, 0),
      profile: module.profile?.id
        ? {
            id: module.profile.id,
            name: module.profile.name,
            systemType: module.profile.systemType
          }
        : null
    })),
    mullions: {
      vertical: asArray(previewModel.mullions?.vertical),
      horizontal: asArray(previewModel.mullions?.horizontal)
    },
    structuralPieces: asArray(previewModel.structuralPieces),
    coveragePercent: toNumber(previewModel.metrics?.coveragePercent, 0)
  }
}
