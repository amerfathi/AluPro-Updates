const toNumber = (value) => Number(value) || 0
const safeArray = (value) => (Array.isArray(value) ? value : [])

const sumBy = (items, selector) =>
  safeArray(items).reduce((sum, item) => sum + toNumber(selector(item)), 0)

const buildProcurementCategory = (rows = [], kind = 'generic') => {
  const safeRows = safeArray(rows)
  const shortageQty = sumBy(safeRows, (row) => row.shortageQty)
  const shortageArea = kind === 'glass' ? sumBy(safeRows, (row) => row.shortageArea) : 0
  const estimatedCost =
    kind === 'glass'
      ? sumBy(safeRows, (row) => toNumber(row.shortageArea) * toNumber(row.pricePerUnit))
      : sumBy(safeRows, (row) => toNumber(row.shortageQty) * toNumber(row.pricePerUnit))

  return {
    rows: safeRows,
    linesCount: safeRows.length,
    shortageQty,
    shortageArea,
    estimatedCost
  }
}

export const buildProductionOrderSnapshot = ({
  isContractLinked = false,
  neededPieces = [],
  neededGlass = [],
  aggregatedAccessories = [],
  aggregatedOperations = [],
  currentProjectResults = [],
  rawCosts = {},
  totalCost = 0,
  materialFlowSnapshot = {},
  financialSummary = {},
  inventoryAlerts = []
} = {}) => {
  const purchase = materialFlowSnapshot?.purchase || {}
  const aluminumShortage = buildProcurementCategory(purchase.aluminum, 'aluminum')
  const glassShortage = buildProcurementCategory(purchase.glass, 'glass')
  const accessoriesShortage = buildProcurementCategory(purchase.accessories, 'accessories')
  const shortageLinesCount =
    aluminumShortage.linesCount + glassShortage.linesCount + accessoriesShortage.linesCount
  const hasShortages = Boolean(isContractLinked && shortageLinesCount > 0)

  const queue = {
    pieceLines: safeArray(neededPieces).length,
    pieceQty: sumBy(neededPieces, (item) => item.quantity),
    glassLines: safeArray(neededGlass).length,
    glassQty: sumBy(neededGlass, (item) => item.quantity),
    accessoriesLines: safeArray(aggregatedAccessories).length,
    accessoriesQty: sumBy(aggregatedAccessories, (item) => item.quantity),
    operationsLines: safeArray(aggregatedOperations).length,
    operationsQty: sumBy(aggregatedOperations, (item) => item.quantity)
  }

  const cutting = {
    profileGroups: safeArray(currentProjectResults).length,
    totalBars: sumBy(currentProjectResults, (group) => safeArray(group.bars).length),
    totalCuts: sumBy(currentProjectResults, (group) =>
      sumBy(group.pieces, (piece) => piece.quantity)
    ),
    totalRemainingLength: sumBy(currentProjectResults, (group) =>
      sumBy(group.bars, (bar) => bar.remaining)
    )
  }

  const costs = {
    aluminumCost: toNumber(rawCosts.aluminumCost),
    glassCost: toNumber(rawCosts.glassCost),
    accessoriesCost: toNumber(rawCosts.accessoriesCost),
    operationsCost: toNumber(rawCosts.operationsCost),
    totalInternalCost: toNumber(totalCost)
  }

  const procurement = {
    hasShortages,
    shortageLinesCount,
    shortageValue: toNumber(materialFlowSnapshot?.totals?.shortageValue),
    consumedValue: toNumber(materialFlowSnapshot?.totals?.consumedValue),
    statusLabel: !isContractLinked
      ? 'مقايسة حرة بدون خصم'
      : hasShortages
        ? 'بانتظار خامات'
        : 'لا توجد نواقص مباشرة',
    categories: {
      aluminum: aluminumShortage,
      glass: glassShortage,
      accessories: accessoriesShortage
    }
  }

  const contract = {
    contractValue: toNumber(financialSummary.contractVal),
    paidAmount: toNumber(financialSummary.paidAmt),
    remainingBalance: toNumber(financialSummary.remainingBalance),
    expectedProfit: toNumber(financialSummary.expectedProfit)
  }

  return {
    queue,
    cutting,
    costs,
    procurement,
    contract,
    alerts: {
      leftoversMatches: safeArray(inventoryAlerts).length
    },
    readiness: {
      canSaveOrder: queue.pieceLines > 0,
      canGeneratePurchaseOrder: isContractLinked && hasShortages,
      isMeasurementOnly: !isContractLinked
    }
  }
}

export const buildLiveShortagesSummary = (orderSnapshot) => ({
  hasShortages: Boolean(orderSnapshot?.procurement?.hasShortages),
  linesCount: toNumber(orderSnapshot?.procurement?.shortageLinesCount),
  statusLabel: orderSnapshot?.procurement?.statusLabel || 'لا توجد نواقص مباشرة'
})
