import { parseArabicNum } from './number.js'
import { compileTechnicalSystemLayout } from './technicalSystem.js'

const MIN_SEGMENT_CM = 1
const OVERLAP_TOLERANCE_CM = 0.5

const createId = () => Math.random().toString(36).slice(2, 11)
const round = (value, digits = 3) => Number(Number(value || 0).toFixed(digits))
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const toMeters = (centimeters) => round(centimeters / 100, 3)
const toNumber = (value, fallback = 0) => {
  const parsed = Number(parseArabicNum(value))
  return Number.isFinite(parsed) ? parsed : fallback
}

export const snapValue = (value, step = 10) => {
  const safeStep = toNumber(step, 10)
  if (safeStep <= 0) return round(value, 1)
  return round(Math.round(value / safeStep) * safeStep, 1)
}

export const createGridNode = (overrides = {}) => ({
  id: overrides.id || createId(),
  splitType: null,
  splitRatio: 50,
  children: [],
  content: 'empty',
  ...overrides
})

export const createEmptyGridTree = () => createGridNode({ id: 'root' })

export const createFacadeCell = (type = 'sash', overrides = {}) => ({
  id: overrides.id || createId(),
  type,
  label: '',
  x: 0,
  y: 0,
  w: 120,
  h: 120,
  ...overrides
})

export const updateGridNode = (tree, targetId, updateFn) => {
  if (tree.id === targetId) return updateFn(tree)
  if (!tree.children?.length) return tree

  return {
    ...tree,
    children: tree.children.map((child) => updateGridNode(child, targetId, updateFn))
  }
}

export const annotateGridTree = (
  tree,
  wallWidthCm,
  wallHeightCm,
  outerFrameThicknessCm,
  mullionThicknessCm
) => {
  const outThick = Math.max(0, toNumber(outerFrameThicknessCm))
  const inThick = Math.max(0, toNumber(mullionThicknessCm))
  const totalClearW = Math.max(0, toNumber(wallWidthCm, 0) - outThick * 2)
  const totalClearH = Math.max(0, toNumber(wallHeightCm, 0) - outThick * 2)

  const annotate = (node, widthCm, heightCm) => {
    const currentNode = {
      ...node,
      exactW: round(widthCm, 1),
      exactH: round(heightCm, 1)
    }

    if (node.splitType === 'V' && node.children?.length === 2) {
      const ratio = node.splitRatio || 50
      const leftWidth = widthCm * (ratio / 100) - inThick / 2
      const rightWidth = widthCm * ((100 - ratio) / 100) - inThick / 2

      currentNode.children = [
        annotate(node.children[0], Math.max(0, leftWidth), heightCm),
        annotate(node.children[1], Math.max(0, rightWidth), heightCm)
      ]
    } else if (node.splitType === 'H' && node.children?.length === 2) {
      const ratio = node.splitRatio || 50
      const topHeight = heightCm * (ratio / 100) - inThick / 2
      const bottomHeight = heightCm * ((100 - ratio) / 100) - inThick / 2

      currentNode.children = [
        annotate(node.children[0], widthCm, Math.max(0, topHeight)),
        annotate(node.children[1], widthCm, Math.max(0, bottomHeight))
      ]
    }

    return currentNode
  }

  return annotate(tree, totalClearW, totalClearH)
}

const mergeSegments = (segments) => {
  const groupedSegments = new Map()

  segments.forEach((segment) => {
    const key = round(segment.coord, 1)
    const current = groupedSegments.get(key) || []
    current.push({
      start: Math.min(segment.start, segment.end),
      end: Math.max(segment.start, segment.end)
    })
    groupedSegments.set(key, current)
  })

  const mergedSegments = []

  groupedSegments.forEach((ranges, coord) => {
    const sortedRanges = [...ranges].sort((left, right) => left.start - right.start)
    let activeRange = null

    sortedRanges.forEach((range) => {
      if (!activeRange) {
        activeRange = { ...range }
        return
      }

      if (range.start <= activeRange.end + OVERLAP_TOLERANCE_CM) {
        activeRange.end = Math.max(activeRange.end, range.end)
      } else {
        mergedSegments.push({ coord, ...activeRange })
        activeRange = { ...range }
      }
    })

    if (activeRange) {
      mergedSegments.push({ coord, ...activeRange })
    }
  })

  return mergedSegments
    .map((segment) => ({
      ...segment,
      lengthCm: round(segment.end - segment.start, 1)
    }))
    .filter((segment) => segment.lengthCm > MIN_SEGMENT_CM)
}

const sanitizeCell = (cell, wallWidthCm, wallHeightCm) => {
  const x = clamp(toNumber(cell.x, 0), 0, wallWidthCm)
  const y = clamp(toNumber(cell.y, 0), 0, wallHeightCm)
  const w = clamp(toNumber(cell.w, 0), 0, wallWidthCm - x)
  const h = clamp(toNumber(cell.h, 0), 0, wallHeightCm - y)

  return {
    ...cell,
    x: round(x, 1),
    y: round(y, 1),
    w: round(w, 1),
    h: round(h, 1)
  }
}

const doCellsOverlap = (leftCell, rightCell) => {
  const overlapWidth =
    Math.min(leftCell.x + leftCell.w, rightCell.x + rightCell.w) - Math.max(leftCell.x, rightCell.x)
  const overlapHeight =
    Math.min(leftCell.y + leftCell.h, rightCell.y + rightCell.h) - Math.max(leftCell.y, rightCell.y)

  return overlapWidth > OVERLAP_TOLERANCE_CM && overlapHeight > OVERLAP_TOLERANCE_CM
}

const buildGridLayoutData = (annotatedTree) => {
  const rawData = {
    mullionsW: [],
    mullionsH: [],
    sashes: [],
    fixed: [],
    coveragePercent: 100,
    blockingIssues: [],
    warnings: []
  }

  const visitNode = (node) => {
    if (node.splitType === 'V' && node.children?.length === 2) {
      rawData.mullionsH.push(toMeters(node.exactH))
      visitNode(node.children[0])
      visitNode(node.children[1])
      return
    }

    if (node.splitType === 'H' && node.children?.length === 2) {
      rawData.mullionsW.push(toMeters(node.exactW))
      visitNode(node.children[0])
      visitNode(node.children[1])
      return
    }

    if (node.content === 'sash') {
      rawData.sashes.push({
        id: node.id,
        label: 'درفة',
        w: toMeters(node.exactW),
        h: toMeters(node.exactH)
      })
    }

    if (node.content === 'fixed') {
      rawData.fixed.push({
        id: node.id,
        label: 'ثابت',
        w: toMeters(node.exactW),
        h: toMeters(node.exactH)
      })
    }
  }

  visitNode(annotatedTree)

  if (rawData.sashes.length === 0 && rawData.fixed.length === 0) {
    rawData.blockingIssues.push('أضف على الأقل فتحة واحدة متحركة أو ثابتة داخل الرسم.')
  }

  return rawData
}

const buildFreeLayoutData = (cells, wallWidthCm, wallHeightCm) => {
  const normalizedCells = cells
    .map((cell) => sanitizeCell(cell, wallWidthCm, wallHeightCm))
    .filter((cell) => cell.w > MIN_SEGMENT_CM && cell.h > MIN_SEGMENT_CM)

  const verticalSegments = []
  const horizontalSegments = []
  const warnings = []
  const blockingIssues = []
  const rawData = {
    mullionsW: [],
    mullionsH: [],
    sashes: [],
    fixed: [],
    coveragePercent: 0,
    warnings,
    blockingIssues,
    cells: normalizedCells
  }

  if (normalizedCells.length === 0) {
    blockingIssues.push('ابدأ برسم مستطيل واحد على الأقل داخل الواجهة.')
    return rawData
  }

  normalizedCells.forEach((cell, index) => {
    if (cell.x > OVERLAP_TOLERANCE_CM) {
      verticalSegments.push({ coord: cell.x, start: cell.y, end: cell.y + cell.h })
    }

    if (cell.x + cell.w < wallWidthCm - OVERLAP_TOLERANCE_CM) {
      verticalSegments.push({
        coord: cell.x + cell.w,
        start: cell.y,
        end: cell.y + cell.h
      })
    }

    if (cell.y > OVERLAP_TOLERANCE_CM) {
      horizontalSegments.push({ coord: cell.y, start: cell.x, end: cell.x + cell.w })
    }

    if (cell.y + cell.h < wallHeightCm - OVERLAP_TOLERANCE_CM) {
      horizontalSegments.push({
        coord: cell.y + cell.h,
        start: cell.x,
        end: cell.x + cell.w
      })
    }

    const sectionEntry = {
      id: cell.id,
      label: cell.label || `${cell.type === 'fixed' ? 'ثابت' : 'درفة'} ${index + 1}`,
      w: toMeters(cell.w),
      h: toMeters(cell.h)
    }

    if (cell.type === 'fixed') rawData.fixed.push(sectionEntry)
    else rawData.sashes.push(sectionEntry)
  })

  for (let leftIndex = 0; leftIndex < normalizedCells.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < normalizedCells.length; rightIndex += 1) {
      if (doCellsOverlap(normalizedCells[leftIndex], normalizedCells[rightIndex])) {
        blockingIssues.push('يوجد تداخل بين بعض الفتحات الحرة. عدل الرسم قبل الإدراج.')
        leftIndex = normalizedCells.length
        break
      }
    }
  }

  const mergedVerticalSegments = mergeSegments(verticalSegments)
  const mergedHorizontalSegments = mergeSegments(horizontalSegments)

  rawData.mullionsH = mergedVerticalSegments.map((segment) => toMeters(segment.lengthCm))
  rawData.mullionsW = mergedHorizontalSegments.map((segment) => toMeters(segment.lengthCm))

  const wallArea = wallWidthCm * wallHeightCm
  const occupiedArea = normalizedCells.reduce((total, cell) => total + cell.w * cell.h, 0)
  rawData.coveragePercent = wallArea > 0 ? round((occupiedArea / wallArea) * 100, 1) : 0

  if (rawData.coveragePercent < 100) {
    warnings.push(
      `التغطية الحالية للواجهة ${rawData.coveragePercent}% فقط. المساحات الفارغة لن تنتج قطاعات أو زجاج.`
    )
  }

  return rawData
}

const buildInventoryPreview = (pieces, glass, accessories, inventory) => {
  const inventoryIndex = new Map(inventory.map((item) => [item.id, item]))
  const preview = []

  const groupedPieces = new Map()
  pieces.forEach((piece) => {
    const current = groupedPieces.get(piece.inventoryId) || {
      type: 'aluminum',
      inventoryId: piece.inventoryId,
      label: piece.inventoryName || 'قطاع غير معروف',
      requiredPieces: 0,
      totalLength: 0
    }

    current.requiredPieces += piece.quantity
    current.totalLength += piece.length * piece.quantity
    groupedPieces.set(piece.inventoryId, current)
  })

  groupedPieces.forEach((entry) => {
    const inventoryItem = inventoryIndex.get(entry.inventoryId)
    const stockLength = toNumber(inventoryItem?.length, 0)
    const stockQty = toNumber(inventoryItem?.stockQty, 0)
    const estimatedBars = stockLength > 0 ? Math.ceil(entry.totalLength / stockLength) : null

    preview.push({
      ...entry,
      unitLabel: 'عود خام',
      stockQty,
      stockLength,
      estimatedStockUse: estimatedBars,
      shortage:
        estimatedBars !== null && stockQty > 0 ? Math.max(0, estimatedBars - stockQty) : null
    })
  })

  const groupedAccessories = new Map()
  accessories.forEach((accessory) => {
    const current = groupedAccessories.get(accessory.inventoryId) || {
      type: 'accessory',
      inventoryId: accessory.inventoryId,
      label: accessory.inventoryName || accessory.name || 'اكسسوار',
      requiredUnits: 0
    }

    current.requiredUnits += accessory.quantity
    groupedAccessories.set(accessory.inventoryId, current)
  })

  groupedAccessories.forEach((entry) => {
    const inventoryItem = inventoryIndex.get(entry.inventoryId)
    const stockQty = toNumber(inventoryItem?.stockQty, 0)

    preview.push({
      ...entry,
      unitLabel: 'قطعة',
      stockQty,
      estimatedStockUse: entry.requiredUnits,
      shortage: stockQty > 0 ? Math.max(0, entry.requiredUnits - stockQty) : null
    })
  })

  const groupedGlass = new Map()
  glass.forEach((glassItem) => {
    const current = groupedGlass.get(glassItem.inventoryId) || {
      type: 'glass',
      inventoryId: glassItem.inventoryId,
      label: glassItem.inventoryName || 'زجاج',
      lites: 0,
      totalArea: 0
    }

    current.lites += glassItem.quantity
    current.totalArea += glassItem.w * glassItem.h * glassItem.quantity
    groupedGlass.set(glassItem.inventoryId, current)
  })

  groupedGlass.forEach((entry) => {
    const inventoryItem = inventoryIndex.get(entry.inventoryId)
    const stockQty = toNumber(inventoryItem?.stockQty, 0)

    preview.push({
      ...entry,
      unitLabel: 'م²',
      stockQty,
      estimatedStockUse: round(entry.totalArea, 2),
      shortage: stockQty > 0 ? Math.max(0, round(entry.totalArea - stockQty, 2)) : null
    })
  })

  return preview.sort((left, right) => left.type.localeCompare(right.type))
}

const compileWithProfile = (rawData, profile, designLabel, quantity, inventory = []) => {
  const inventoryIndex = new Map(inventory.map((item) => [item.id, item]))
  const compiled = compileTechnicalSystemLayout({
    system: profile,
    layout: {
      wallWidthM: rawData.wallWidthM,
      wallHeightM: rawData.wallHeightM,
      mullionsW: rawData.mullionsW,
      mullionsH: rawData.mullionsH,
      fixed: rawData.fixed,
      sashes: rawData.sashes
    },
    label: designLabel,
    quantity
  })

  const pieces = compiled.pieces.map((piece) => ({
    ...piece,
    inventoryName: inventoryIndex.get(piece.inventoryId)?.name || piece.label.split(' - ').at(-1)
  }))
  const glass = compiled.glass.map((glassItem) => ({
    ...glassItem,
    inventoryName: inventoryIndex.get(glassItem.inventoryId)?.name || 'زجاج'
  }))
  const accessories = compiled.accessories.map((accessory) => ({
    ...accessory,
    inventoryName: inventoryIndex.get(accessory.inventoryId)?.name || accessory.name
  }))

  return {
    pieces,
    glass,
    accessories,
    operations: compiled.operations,
    inventoryPreview: buildInventoryPreview(pieces, glass, accessories, inventory)
  }
}

export const compileFacadeDesign = ({
  mode,
  gridTree,
  cells,
  wallWidthCm,
  wallHeightCm,
  outerFrameThicknessCm,
  mullionThicknessCm,
  profile,
  label,
  quantity,
  inventory = []
}) => {
  const safeWallWidthCm = Math.max(1, toNumber(wallWidthCm, 400))
  const safeWallHeightCm = Math.max(1, toNumber(wallHeightCm, 300))
  const facadeLabel = String(label || 'واجهة').trim() || 'واجهة'
  const rawData =
    mode === 'free'
      ? buildFreeLayoutData(cells || [], safeWallWidthCm, safeWallHeightCm)
      : buildGridLayoutData(
          annotateGridTree(
            gridTree || createEmptyGridTree(),
            safeWallWidthCm,
            safeWallHeightCm,
            outerFrameThicknessCm,
            mullionThicknessCm
          )
        )

  rawData.wallWidthM = toMeters(safeWallWidthCm)
  rawData.wallHeightM = toMeters(safeWallHeightCm)

  const result = {
    pieces: [],
    glass: [],
    accessories: [],
    operations: [],
    inventoryPreview: [],
    warnings: [...rawData.warnings],
    blockingIssues: [...rawData.blockingIssues],
    stats: {
      sashCount: rawData.sashes.length,
      fixedCount: rawData.fixed.length,
      horizontalMullions: rawData.mullionsW.length,
      verticalMullions: rawData.mullionsH.length,
      coveragePercent: rawData.coveragePercent
    }
  }

  if (!profile) {
    result.blockingIssues.push('اختر القطاع أولًا حتى يتم تحويل الرسم إلى قص ومخزون.')
    return result
  }

  const compiled = compileWithProfile(rawData, profile, facadeLabel, quantity, inventory)
  result.pieces = compiled.pieces
  result.glass = compiled.glass
  result.accessories = compiled.accessories
  result.operations = compiled.operations
  result.inventoryPreview = compiled.inventoryPreview

  if (
    compiled.pieces.length === 0 &&
    compiled.glass.length === 0 &&
    compiled.accessories.length === 0 &&
    compiled.operations.length === 0
  ) {
    result.blockingIssues.push('الرسم الحالي لم ينتج أي مواد. تحقق من الكتالوج والأدوار التصنيعية.')
  }

  return result
}
