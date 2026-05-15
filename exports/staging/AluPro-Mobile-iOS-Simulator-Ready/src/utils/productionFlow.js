const DEFAULT_MEASUREMENT_NAME = 'مقايسة عامة (بدون تسعير)'

const round3 = (value) => Number((Number(value) || 0).toFixed(3))

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
