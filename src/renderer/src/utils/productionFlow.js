import { optimizeCutting } from './aluCalculations.js'

const DEFAULT_MEASUREMENT_NAME = 'مقايسة عامة (بدون تسعير)'

const round3 = (value) => Number((Number(value) || 0).toFixed(3))
const ensureArray = (value) => (Array.isArray(value) ? value : [])
const toPositiveNumber = (value) => Math.max(0, Number(value) || 0)
const toSafeId = (value, prefix, index) => value || `${prefix}-${Date.now()}-${index}`

const mergeByKey = (items, keyBuilder, mergeFn) => {
  const map = new Map()

  items.forEach((item) => {
    const key = keyBuilder(item)
    if (!map.has(key)) {
      map.set(key, { ...item })
      return
    }
    map.set(key, mergeFn(map.get(key), item))
  })

  return Array.from(map.values())
}

const normalizePiece = (piece, index = 0) => {
  const length = round3(toPositiveNumber(piece?.length))
  const quantity = Math.round(toPositiveNumber(piece?.quantity))
  if (length <= 0 || quantity <= 0) return null

  const cutType = String(piece?.cutType || '90') === '45' ? '45' : '90'

  return {
    ...piece,
    id: toSafeId(piece?.id, 'piece', index),
    length,
    quantity,
    cutType,
    miterWasteCm: toPositiveNumber(piece?.miterWasteCm)
  }
}

const normalizeGlass = (glassPiece, index = 0) => {
  const w = round3(toPositiveNumber(glassPiece?.w))
  const h = round3(toPositiveNumber(glassPiece?.h))
  const quantity = Math.round(toPositiveNumber(glassPiece?.quantity))
  if (w <= 0 || h <= 0 || quantity <= 0) return null

  return {
    ...glassPiece,
    id: toSafeId(glassPiece?.id, 'glass', index),
    w,
    h,
    quantity
  }
}

const normalizeAccessory = (item, index = 0) => {
  const quantity = round3(toPositiveNumber(item?.quantity))
  if (quantity <= 0) return null

  return {
    ...item,
    id: toSafeId(item?.id, 'acc', index),
    quantity
  }
}

const normalizeOperation = (operation, index = 0) => {
  const quantity = round3(toPositiveNumber(operation?.quantity))
  const costPerUnit = round3(toPositiveNumber(operation?.costPerUnit))
  if (quantity <= 0) return null

  const explicitTotal = toPositiveNumber(operation?.totalCost)
  const totalCost = explicitTotal > 0 ? round3(explicitTotal) : round3(quantity * costPerUnit)

  return {
    ...operation,
    id: toSafeId(operation?.id, 'op', index),
    quantity,
    costPerUnit,
    totalCost
  }
}

const pieceMergeKey = (piece) =>
  [
    piece.profileId || '',
    piece.inventoryId || '',
    piece.label || '',
    piece.length,
    piece.cutType || '90',
    piece.miterWasteCm || 0
  ].join('|')

const glassMergeKey = (piece) =>
  [piece.inventoryId || '', piece.label || '', piece.w, piece.h].join('|')

const accessoryMergeKey = (item) =>
  [item.inventoryId || '', item.name || '', item.unit || '', item.notes || ''].join('|')

const operationMergeKey = (item) =>
  [
    item.category || 'assembly',
    item.name || 'عملية ورشة',
    item.unitLabel || 'عملية',
    item.sectionType || 'all',
    item.notes || '',
    Number(item.costPerUnit) || 0
  ].join('|')

const normalizePieces = (pieces = []) =>
  mergeByKey(
    ensureArray(pieces)
      .map((item, index) => normalizePiece(item, index))
      .filter(Boolean),
    pieceMergeKey,
    (current, incoming) => ({
      ...current,
      quantity: current.quantity + incoming.quantity
    })
  )

const normalizeGlassItems = (glass = []) =>
  mergeByKey(
    ensureArray(glass)
      .map((item, index) => normalizeGlass(item, index))
      .filter(Boolean),
    glassMergeKey,
    (current, incoming) => ({
      ...current,
      quantity: current.quantity + incoming.quantity
    })
  )

const normalizeAccessories = (accessories = []) =>
  mergeByKey(
    ensureArray(accessories)
      .map((item, index) => normalizeAccessory(item, index))
      .filter(Boolean),
    accessoryMergeKey,
    (current, incoming) => ({
      ...current,
      quantity: round3(current.quantity + incoming.quantity)
    })
  )

const normalizeOperations = (operations = []) =>
  mergeByKey(
    ensureArray(operations)
      .map((item, index) => normalizeOperation(item, index))
      .filter(Boolean),
    operationMergeKey,
    (current, incoming) => {
      const quantity = round3(current.quantity + incoming.quantity)
      const totalCost = round3((Number(current.totalCost) || 0) + (Number(incoming.totalCost) || 0))
      return {
        ...current,
        quantity,
        totalCost,
        costPerUnit:
          quantity > 0
            ? round3(totalCost / quantity)
            : round3(Number(current.costPerUnit) || Number(incoming.costPerUnit) || 0)
      }
    }
  )

export const normalizeProductionBatch = ({
  pieces = [],
  glass = [],
  accessories = [],
  operations = []
} = {}) => ({
  pieces: normalizePieces(pieces),
  glass: normalizeGlassItems(glass),
  accessories: normalizeAccessories(accessories),
  operations: normalizeOperations(operations)
})

export const hasProductionBatchItems = (batch = {}) => {
  const normalized = normalizeProductionBatch(batch)
  return (
    normalized.pieces.length > 0 ||
    normalized.glass.length > 0 ||
    normalized.accessories.length > 0 ||
    normalized.operations.length > 0
  )
}

export const mergeProductionPieces = (current = [], incoming = []) =>
  normalizePieces([...ensureArray(current), ...ensureArray(incoming)])

export const mergeProductionGlass = (current = [], incoming = []) =>
  normalizeGlassItems([...ensureArray(current), ...ensureArray(incoming)])

export const mergeProductionAccessories = (current = [], incoming = []) =>
  normalizeAccessories([...ensureArray(current), ...ensureArray(incoming)])

export const mergeProductionOperations = (current = [], incoming = []) =>
  normalizeOperations([...ensureArray(current), ...ensureArray(incoming)])

export const buildProductionNeedsModel = ({
  neededPieces = [],
  neededGlass = [],
  neededAccessories = [],
  neededOperations = [],
  inventory = [],
  bladeThickness = 3
}) => {
  const safePieces = normalizePieces(neededPieces)
  const safeGlass = normalizeGlassItems(neededGlass)
  const aggregatedAccessories = normalizeAccessories(neededAccessories)
  const aggregatedOperations = normalizeOperations(neededOperations)
  const inventoryById = new Map(ensureArray(inventory).map((item) => [item.id, item]))

  const groupedPieces = {}
  safePieces.forEach((piece) => {
    const key = piece.inventoryId || piece.label
    if (!groupedPieces[key]) {
      const inventoryItem = inventoryById.get(piece.inventoryId)
      groupedPieces[key] = {
        inventoryId: piece.inventoryId,
        itemName: inventoryItem ? inventoryItem.name : 'غير محدد بالمستودع',
        profileId: piece.profileId,
        pieces: [],
        pricePerBar: Number(inventoryItem?.price) || 0,
        barLength: Number(inventoryItem?.length) || 5.8
      }
    }
    groupedPieces[key].pieces.push(piece)
  })

  const currentProjectResults = Object.values(groupedPieces)
    .map((group) => ({
      ...group,
      bars: optimizeCutting(group.pieces, group.barLength, bladeThickness, 6.5)
    }))
    .sort((a, b) => String(a.itemName || '').localeCompare(String(b.itemName || ''), 'ar'))

  const resolvePrice = (inventoryId) => Number(inventoryById.get(inventoryId)?.price) || 0

  const aluminumCost = currentProjectResults.reduce(
    (sum, group) => sum + group.bars.length * (Number(group.pricePerBar) || 0),
    0
  )
  const glassCost = safeGlass.reduce(
    (sum, item) => sum + item.w * item.h * item.quantity * resolvePrice(item.inventoryId),
    0
  )
  const accessoriesCost = aggregatedAccessories.reduce(
    (sum, item) => sum + item.quantity * resolvePrice(item.inventoryId),
    0
  )
  const operationsCost = aggregatedOperations.reduce(
    (sum, item) => sum + (Number(item.totalCost) || item.quantity * item.costPerUnit || 0),
    0
  )

  const rawCosts = {
    aluminumCost,
    glassCost,
    accessoriesCost,
    operationsCost,
    total: aluminumCost + glassCost + accessoriesCost + operationsCost
  }

  return {
    currentProjectResults,
    aggregatedAccessories,
    aggregatedOperations,
    rawCosts,
    totalCost: rawCosts.total
  }
}

const sumByInventory = (items, valueField) => {
  const totals = {}

  items.forEach((item) => {
    if (!item?.inventoryId) return
    totals[item.inventoryId] = round3(
      (totals[item.inventoryId] || 0) + (Number(item[valueField]) || 0)
    )
  })

  return totals
}

export const isContractProject = (project) => {
  if (!project) return false

  const workflowMode = project.workflowMode || project.info?.workflowMode
  if (workflowMode) return workflowMode === 'contract'

  const info = project.info || project
  const contractItems = Array.isArray(info?.contractItems) ? info.contractItems : []

  return contractItems.some((item) => {
    const name = item?.name?.trim()
    return Boolean(name && name !== DEFAULT_MEASUREMENT_NAME)
  })
}

export const buildInventoryBaseline = (inventory, previousFlow) => {
  const aluminumRestored = sumByInventory(previousFlow?.aluminum || [], 'consumedQty')
  const accessoriesRestored = sumByInventory(previousFlow?.accessories || [], 'consumedQty')
  const glassRestored = sumByInventory(previousFlow?.glass || [], 'consumedArea')

  return inventory.map((item) => {
    const restoredQty =
      (aluminumRestored[item.id] || 0) +
      (accessoriesRestored[item.id] || 0) +
      (glassRestored[item.id] || 0)

    return restoredQty
      ? { ...item, stockQty: round3((Number(item.stockQty) || 0) + restoredQty) }
      : { ...item }
  })
}

export const buildMaterialFlowSnapshot = ({
  isContractLinked,
  currentProjectResults,
  neededGlass,
  aggregatedAccessories,
  inventory
}) => {
  const inventoryById = new Map(inventory.map((item) => [item.id, item]))
  const glassAvailableArea = Object.fromEntries(
    inventory
      .filter((item) => item.category === 'glass')
      .map((item) => [item.id, Number(item.stockQty) || 0])
  )

  const aluminum = currentProjectResults.map((group) => {
    const inventoryItem = inventoryById.get(group.inventoryId)
    const requiredQty = group.bars.length
    const availableQty = Number(inventoryItem?.stockQty) || 0
    const consumedQty = isContractLinked ? Math.min(requiredQty, Math.max(availableQty, 0)) : 0
    const shortageQty = isContractLinked ? Math.max(requiredQty - consumedQty, 0) : 0

    return {
      inventoryId: group.inventoryId,
      profileId: group.profileId,
      itemName: group.itemName,
      barLength: Number(group.barLength) || Number(inventoryItem?.length) || 5.8,
      pricePerUnit: Number(group.pricePerBar) || Number(inventoryItem?.price) || 0,
      requiredQty,
      availableQty,
      consumedQty,
      shortageQty
    }
  })

  const glassKeyMap = new Map()

  neededGlass.forEach((item) => {
    const inventoryItem = inventoryById.get(item.inventoryId)
    const areaPerPiece = round3((Number(item.w) || 0) * (Number(item.h) || 0))
    const requiredQty = Number(item.quantity) || 0
    const availableAreaBefore = Number(glassAvailableArea[item.inventoryId]) || 0

    let consumedQty = 0
    if (isContractLinked && areaPerPiece > 0) {
      consumedQty = Math.min(requiredQty, Math.floor((availableAreaBefore + 1e-9) / areaPerPiece))
      glassAvailableArea[item.inventoryId] = round3(
        availableAreaBefore - consumedQty * areaPerPiece
      )
    }

    const shortageQty = isContractLinked ? requiredQty - consumedQty : 0
    const entry = {
      inventoryId: item.inventoryId,
      itemName: inventoryItem?.name || item.label,
      width: Number(item.w) || 0,
      height: Number(item.h) || 0,
      pricePerUnit: Number(inventoryItem?.price) || 0,
      requiredQty,
      requiredArea: round3(requiredQty * areaPerPiece),
      consumedQty,
      consumedArea: round3(consumedQty * areaPerPiece),
      shortageQty,
      shortageArea: round3(shortageQty * areaPerPiece)
    }

    const key = `${entry.inventoryId || entry.itemName}|${entry.width}|${entry.height}`
    if (!glassKeyMap.has(key)) {
      glassKeyMap.set(key, entry)
    } else {
      const current = glassKeyMap.get(key)
      glassKeyMap.set(key, {
        ...current,
        requiredQty: current.requiredQty + entry.requiredQty,
        requiredArea: round3(current.requiredArea + entry.requiredArea),
        consumedQty: current.consumedQty + entry.consumedQty,
        consumedArea: round3(current.consumedArea + entry.consumedArea),
        shortageQty: current.shortageQty + entry.shortageQty,
        shortageArea: round3(current.shortageArea + entry.shortageArea)
      })
    }
  })

  const accessories = aggregatedAccessories.map((item) => {
    const inventoryItem = inventoryById.get(item.inventoryId)
    const requiredQty = Number(item.quantity) || 0
    const availableQty = Number(inventoryItem?.stockQty) || 0
    const consumedQty = isContractLinked ? Math.min(requiredQty, Math.max(availableQty, 0)) : 0
    const shortageQty = isContractLinked ? Math.max(requiredQty - consumedQty, 0) : 0

    return {
      inventoryId: item.inventoryId,
      itemName: inventoryItem?.name || item.name,
      pricePerUnit: Number(inventoryItem?.price) || 0,
      requiredQty,
      availableQty,
      consumedQty,
      shortageQty
    }
  })

  const glass = Array.from(glassKeyMap.values())

  const totals = {
    consumedValue: round3(
      aluminum.reduce((sum, item) => sum + item.consumedQty * item.pricePerUnit, 0) +
        glass.reduce((sum, item) => sum + item.consumedArea * item.pricePerUnit, 0) +
        accessories.reduce((sum, item) => sum + item.consumedQty * item.pricePerUnit, 0)
    ),
    shortageValue: round3(
      aluminum.reduce((sum, item) => sum + item.shortageQty * item.pricePerUnit, 0) +
        glass.reduce((sum, item) => sum + item.shortageArea * item.pricePerUnit, 0) +
        accessories.reduce((sum, item) => sum + item.shortageQty * item.pricePerUnit, 0)
    )
  }

  return {
    isContractLinked,
    aluminum,
    glass,
    accessories,
    purchase: {
      aluminum: aluminum.filter((item) => item.shortageQty > 0),
      glass: glass.filter((item) => item.shortageQty > 0),
      accessories: accessories.filter((item) => item.shortageQty > 0)
    },
    totals
  }
}

export const applyMaterialConsumptionToInventory = ({ inventory = [], materialFlow = {} } = {}) => {
  const updated = inventory.map((item) => ({ ...item }))
  const indexById = new Map(updated.map((item, index) => [item.id, index]))
  const consumptionMap = [
    ['aluminum', 'consumedQty'],
    ['glass', 'consumedArea'],
    ['accessories', 'consumedQty']
  ]

  consumptionMap.forEach(([bucket, consumedField]) => {
    ensureArray(materialFlow?.[bucket]).forEach((row) => {
      if (!row?.inventoryId) return
      const index = indexById.get(row.inventoryId)
      if (index === undefined) return

      const consumedValue = toPositiveNumber(row[consumedField])
      if (consumedValue <= 0) return

      updated[index] = {
        ...updated[index],
        stockQty: round3((Number(updated[index].stockQty) || 0) - consumedValue)
      }
    })
  })

  return updated
}

export const buildProjectLeftovers = ({
  projectId,
  currentProjectResults,
  materialFlow,
  localeDate = new Date().toLocaleDateString()
}) => {
  const consumedBarsByInventory = Object.fromEntries(
    (materialFlow?.aluminum || []).map((item) => [item.inventoryId, item.consumedQty])
  )

  return currentProjectResults.flatMap((group) => {
    const allowedBars = consumedBarsByInventory[group.inventoryId] || 0

    return group.bars.slice(0, allowedBars).flatMap((bar, index) => {
      if (Number(bar.remaining) < 0.4) return []

      return [
        {
          id: `${projectId}-${group.inventoryId || group.profileId}-${index}-${Date.now()}`,
          sourceProjectId: projectId,
          inventoryId: group.inventoryId,
          profileId: group.profileId,
          profileName: group.itemName,
          extrusionType: 'بواقي',
          length: round3(bar.remaining),
          date: localeDate
        }
      ]
    })
  })
}
