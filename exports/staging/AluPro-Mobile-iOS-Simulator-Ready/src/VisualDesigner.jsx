import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  Columns,
  Copy,
  Grid,
  Layout,
  MousePointer2,
  Move,
  RefreshCw,
  Rows,
  ScanLine,
  SlidersHorizontal,
  Square,
  Trash2,
  Wrench,
  Boxes
} from 'lucide-react'
import {
  annotateGridTree,
  compileFacadeDesign,
  createEmptyGridTree,
  createFacadeCell,
  createGridNode,
  snapValue,
  updateGridNode
} from './utils/facadeDesigner.js'

const MIN_CELL_SIZE_CM = 20

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const findGridPath = (tree, targetId, currentPath = []) => {
  const nextPath = [...currentPath, tree]
  if (tree.id === targetId) return nextPath

  if (tree.children?.length) {
    for (const child of tree.children) {
      const result = findGridPath(child, targetId, nextPath)
      if (result) return result
    }
  }

  return null
}

const resizeFreeCell = (origin, point, handle, wallWidthCm, wallHeightCm, snapGridCm) => {
  let left = origin.x
  let top = origin.y
  let right = origin.x + origin.w
  let bottom = origin.y + origin.h

  if (handle.includes('l')) {
    left = clamp(snapValue(point.x, snapGridCm), 0, right - MIN_CELL_SIZE_CM)
  }

  if (handle.includes('r')) {
    right = clamp(snapValue(point.x, snapGridCm), left + MIN_CELL_SIZE_CM, wallWidthCm)
  }

  if (handle.includes('t')) {
    top = clamp(snapValue(point.y, snapGridCm), 0, bottom - MIN_CELL_SIZE_CM)
  }

  if (handle.includes('b')) {
    bottom = clamp(snapValue(point.y, snapGridCm), top + MIN_CELL_SIZE_CM, wallHeightCm)
  }

  return {
    ...origin,
    x: left,
    y: top,
    w: right - left,
    h: bottom - top
  }
}

const cellTypeMeta = {
  sash: {
    label: 'متحرك',
    fill: 'from-indigo-500/20 via-indigo-400/10 to-indigo-200/20',
    border: 'border-indigo-500',
    text: 'text-indigo-900'
  },
  fixed: {
    label: 'ثابت',
    fill: 'from-cyan-400/25 via-sky-300/15 to-cyan-100/20',
    border: 'border-cyan-500',
    text: 'text-cyan-900'
  }
}

const facadePresets = [
  {
    id: 'sliding-window',
    label: 'شباك سحاب',
    shortLabel: 'سحاب',
    category: 'window',
    sectionType: 'sash',
    defaultWidth: 160,
    defaultHeight: 120,
    drawing: 'sliding'
  },
  {
    id: 'casement-window',
    label: 'شباك مفصلي',
    shortLabel: 'مفصلي',
    category: 'window',
    sectionType: 'sash',
    defaultWidth: 140,
    defaultHeight: 120,
    drawing: 'casement'
  },
  {
    id: 'double-casement-window',
    label: 'شباك دبل',
    shortLabel: 'دبل',
    category: 'window',
    sectionType: 'sash',
    defaultWidth: 180,
    defaultHeight: 120,
    drawing: 'double-casement'
  },
  {
    id: 'fixed-window',
    label: 'شباك ثابت',
    shortLabel: 'ثابت',
    category: 'window',
    sectionType: 'fixed',
    defaultWidth: 140,
    defaultHeight: 120,
    drawing: 'fixed'
  },
  {
    id: 'single-door',
    label: 'باب مفرد',
    shortLabel: 'باب مفرد',
    category: 'door',
    sectionType: 'sash',
    defaultWidth: 110,
    defaultHeight: 220,
    drawing: 'single-door'
  },
  {
    id: 'double-door',
    label: 'باب دبل',
    shortLabel: 'باب دبل',
    category: 'door',
    sectionType: 'sash',
    defaultWidth: 180,
    defaultHeight: 220,
    drawing: 'double-door'
  },
  {
    id: 'curtain-panel',
    label: 'واجهة ثابتة',
    shortLabel: 'واجهة',
    category: 'facade',
    sectionType: 'fixed',
    defaultWidth: 220,
    defaultHeight: 240,
    drawing: 'curtain-panel'
  }
]

const defaultPresetId = facadePresets[0].id

const resolveFacadePreset = (presetId, fallbackType = 'sash') =>
  facadePresets.find((preset) => preset.id === presetId) ||
  facadePresets.find((preset) => preset.sectionType === fallbackType) ||
  facadePresets[0]

const FacadePresetIllustration = ({ presetId, fallbackType = 'sash', className = '' }) => {
  const preset = resolveFacadePreset(presetId, fallbackType)
  const frameStroke = preset.sectionType === 'fixed' ? '#0891B2' : '#3F3CBB'
  const glassFill = preset.sectionType === 'fixed' ? '#D7F4FF' : '#E6E8FF'
  const accent = preset.sectionType === 'fixed' ? '#06B6D4' : '#5C54A4'

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="8"
        fill="#F8FAFC"
        stroke={frameStroke}
        strokeWidth="4"
      />
      <rect
        x="12"
        y="12"
        width="76"
        height="76"
        rx="5"
        fill={glassFill}
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="2"
      />
      <path
        d="M22 20 L74 20 L58 36"
        fill="none"
        stroke="rgba(255,255,255,0.75)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {preset.drawing === 'sliding' && (
        <>
          <rect
            x="14"
            y="16"
            width="34"
            height="68"
            rx="4"
            fill="none"
            stroke={accent}
            strokeWidth="3"
          />
          <rect
            x="52"
            y="16"
            width="34"
            height="68"
            rx="4"
            fill="none"
            stroke={accent}
            strokeWidth="3"
          />
          <line
            x1="48"
            y1="18"
            x2="48"
            y2="82"
            stroke={accent}
            strokeWidth="2.5"
            strokeDasharray="4 3"
          />
          <line
            x1="62"
            y1="45"
            x2="62"
            y2="56"
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="38"
            y1="45"
            x2="38"
            y2="56"
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}

      {preset.drawing === 'casement' && (
        <>
          <rect
            x="16"
            y="16"
            width="68"
            height="68"
            rx="4"
            fill="none"
            stroke={accent}
            strokeWidth="3"
          />
          <path
            d="M20 80 Q52 50 80 20"
            fill="none"
            stroke={accent}
            strokeWidth="2.5"
            strokeDasharray="5 4"
          />
          <line x1="20" y1="20" x2="20" y2="80" stroke={accent} strokeWidth="3" />
          <circle cx="74" cy="50" r="2.5" fill={accent} />
        </>
      )}

      {preset.drawing === 'double-casement' && (
        <>
          <rect
            x="14"
            y="16"
            width="72"
            height="68"
            rx="4"
            fill="none"
            stroke={accent}
            strokeWidth="3"
          />
          <line x1="50" y1="16" x2="50" y2="84" stroke={accent} strokeWidth="2.5" />
          <path
            d="M18 80 Q34 50 48 22"
            fill="none"
            stroke={accent}
            strokeWidth="2.3"
            strokeDasharray="4 4"
          />
          <path
            d="M82 80 Q66 50 52 22"
            fill="none"
            stroke={accent}
            strokeWidth="2.3"
            strokeDasharray="4 4"
          />
          <circle cx="46" cy="50" r="2.2" fill={accent} />
          <circle cx="54" cy="50" r="2.2" fill={accent} />
        </>
      )}

      {preset.drawing === 'fixed' && (
        <>
          <rect
            x="18"
            y="18"
            width="64"
            height="64"
            rx="4"
            fill="none"
            stroke={accent}
            strokeWidth="3"
          />
          <path
            d="M24 72 L76 24"
            fill="none"
            stroke="rgba(14,165,233,0.25)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M28 28 L44 28"
            fill="none"
            stroke={accent}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </>
      )}

      {preset.drawing === 'single-door' && (
        <>
          <rect
            x="24"
            y="10"
            width="52"
            height="80"
            rx="4"
            fill="none"
            stroke={accent}
            strokeWidth="3"
          />
          <line x1="36" y1="10" x2="36" y2="90" stroke={accent} strokeWidth="2.5" />
          <path
            d="M38 82 Q56 52 72 18"
            fill="none"
            stroke={accent}
            strokeWidth="2.3"
            strokeDasharray="4 4"
          />
          <circle cx="65" cy="50" r="2.5" fill={accent} />
        </>
      )}

      {preset.drawing === 'double-door' && (
        <>
          <rect
            x="16"
            y="10"
            width="68"
            height="80"
            rx="4"
            fill="none"
            stroke={accent}
            strokeWidth="3"
          />
          <line x1="50" y1="10" x2="50" y2="90" stroke={accent} strokeWidth="2.5" />
          <path
            d="M20 82 Q34 54 48 16"
            fill="none"
            stroke={accent}
            strokeWidth="2.3"
            strokeDasharray="4 4"
          />
          <path
            d="M80 82 Q66 54 52 16"
            fill="none"
            stroke={accent}
            strokeWidth="2.3"
            strokeDasharray="4 4"
          />
          <circle cx="46" cy="52" r="2.4" fill={accent} />
          <circle cx="54" cy="52" r="2.4" fill={accent} />
        </>
      )}

      {preset.drawing === 'curtain-panel' && (
        <>
          <rect
            x="14"
            y="12"
            width="72"
            height="76"
            rx="4"
            fill="none"
            stroke={accent}
            strokeWidth="3"
          />
          <line x1="50" y1="12" x2="50" y2="88" stroke={accent} strokeWidth="2.4" />
          <line x1="14" y1="40" x2="86" y2="40" stroke={accent} strokeWidth="2.4" />
          <line x1="14" y1="64" x2="86" y2="64" stroke={accent} strokeWidth="2.4" opacity="0.65" />
        </>
      )}
    </svg>
  )
}

const renderPreviewValue = (previewItem) => {
  if (previewItem.type === 'aluminum') {
    return `${previewItem.requiredPieces} قطعة | ${previewItem.totalLength.toFixed(2)} م`
  }

  if (previewItem.type === 'glass') {
    return `${previewItem.lites} لوح | ${previewItem.totalArea.toFixed(2)} م²`
  }

  return `${previewItem.requiredUnits} قطعة`
}

const VisualDesigner = ({ profiles = [], inventory = [], onSave }) => {
  const [designMode, setDesignMode] = useState('grid')
  const [wallSize, setWallSize] = useState({ width: '400', height: '300' })
  const [quantity, setQuantity] = useState('1')
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [windowLabel, setWindowLabel] = useState('واجهة رئيسية 1')
  const [outerFrameThick, setOuterFrameThick] = useState('4')
  const [innerMullionThick, setInnerMullionThick] = useState('5')

  const [gridTree, setGridTree] = useState(createEmptyGridTree)
  const [selectedGridId, setSelectedGridId] = useState('root')

  const [freeCells, setFreeCells] = useState([])
  const [selectedCellId, setSelectedCellId] = useState(null)
  const [freeTool, setFreeTool] = useState('select')
  const [selectedPresetId, setSelectedPresetId] = useState(defaultPresetId)
  const [snapGridCm, setSnapGridCm] = useState('10')
  const [draftCell, setDraftCell] = useState(null)
  const [interaction, setInteraction] = useState(null)

  const canvasRef = useRef(null)

  const wallWidthCm = Math.max(100, Number(wallSize.width) || 400)
  const wallHeightCm = Math.max(100, Number(wallSize.height) || 300)
  const snapStepCm = Math.max(5, Number(snapGridCm) || 10)
  const selectedPreset = resolveFacadePreset(selectedPresetId)
  const selectedProfile = profiles.find(
    (profile) => String(profile.id) === String(selectedProfileId)
  )

  const annotatedTree = useMemo(
    () => annotateGridTree(gridTree, wallWidthCm, wallHeightCm, outerFrameThick, innerMullionThick),
    [gridTree, wallWidthCm, wallHeightCm, outerFrameThick, innerMullionThick]
  )

  const selectedGridPath = useMemo(
    () => (selectedGridId ? findGridPath(annotatedTree, selectedGridId) : null),
    [annotatedTree, selectedGridId]
  )

  const selectedGridNode = selectedGridPath ? selectedGridPath[selectedGridPath.length - 1] : null

  let widthParentIndex = -1
  let heightParentIndex = -1

  if (selectedGridPath) {
    for (let index = selectedGridPath.length - 2; index >= 0; index -= 1) {
      if (widthParentIndex === -1 && selectedGridPath[index].splitType === 'V')
        widthParentIndex = index
      if (heightParentIndex === -1 && selectedGridPath[index].splitType === 'H')
        heightParentIndex = index
    }
  }

  const widthParent = widthParentIndex !== -1 ? selectedGridPath[widthParentIndex] : null
  const heightParent = heightParentIndex !== -1 ? selectedGridPath[heightParentIndex] : null
  const canEditWidth = Boolean(widthParent)
  const canEditHeight = Boolean(heightParent)
  const selectedCell = freeCells.find((cell) => cell.id === selectedCellId) || null

  const addPresetToCanvas = useCallback(
    (presetId = selectedPresetId) => {
      const preset = resolveFacadePreset(presetId)
      const safeWidth = Math.min(preset.defaultWidth, wallWidthCm)
      const safeHeight = Math.min(preset.defaultHeight, wallHeightCm)
      const offsetSeed = freeCells.length % 6
      const nextCell = createFacadeCell(preset.sectionType, {
        presetId: preset.id,
        label: preset.label,
        x: clamp(
          snapValue((wallWidthCm - safeWidth) / 2 + offsetSeed * snapStepCm, snapStepCm),
          0,
          wallWidthCm - safeWidth
        ),
        y: clamp(
          snapValue((wallHeightCm - safeHeight) / 2 + offsetSeed * snapStepCm, snapStepCm),
          0,
          wallHeightCm - safeHeight
        ),
        w: safeWidth,
        h: safeHeight
      })

      setFreeCells((previousCells) => [...previousCells, nextCell])
      setSelectedCellId(nextCell.id)
      setFreeTool('select')
    },
    [freeCells.length, selectedPresetId, snapStepCm, wallHeightCm, wallWidthCm]
  )

  const preview = useMemo(
    () =>
      compileFacadeDesign({
        mode: designMode,
        gridTree,
        cells: freeCells,
        wallWidthCm,
        wallHeightCm,
        outerFrameThicknessCm: outerFrameThick,
        mullionThicknessCm: innerMullionThick,
        profile: selectedProfile,
        label: windowLabel,
        quantity,
        inventory
      }),
    [
      designMode,
      gridTree,
      freeCells,
      wallWidthCm,
      wallHeightCm,
      outerFrameThick,
      innerMullionThick,
      selectedProfile,
      windowLabel,
      quantity,
      inventory
    ]
  )

  const getCanvasPoint = useCallback(
    (clientX, clientY) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0 || rect.height === 0) return null

      const x = ((clientX - rect.left) / rect.width) * wallWidthCm
      const y = ((clientY - rect.top) / rect.height) * wallHeightCm

      return {
        x: clamp(snapValue(x, snapStepCm), 0, wallWidthCm),
        y: clamp(snapValue(y, snapStepCm), 0, wallHeightCm)
      }
    },
    [snapStepCm, wallHeightCm, wallWidthCm]
  )

  useEffect(() => {
    if (!interaction) return

    const handleMouseMove = (event) => {
      const point = getCanvasPoint(event.clientX, event.clientY)
      if (!point) return

      if (interaction.type === 'drawing') {
        const nextX = Math.min(interaction.start.x, point.x)
        const nextY = Math.min(interaction.start.y, point.y)
        const nextW = Math.abs(point.x - interaction.start.x)
        const nextH = Math.abs(point.y - interaction.start.y)

        setDraftCell({
          type: interaction.cellType,
          x: nextX,
          y: nextY,
          w: nextW,
          h: nextH
        })
      }

      if (interaction.type === 'drag') {
        setFreeCells((previousCells) =>
          previousCells.map((cell) => {
            if (cell.id !== interaction.cellId) return cell

            const nextX = clamp(
              snapValue(interaction.origin.x + (point.x - interaction.start.x), snapStepCm),
              0,
              wallWidthCm - interaction.origin.w
            )
            const nextY = clamp(
              snapValue(interaction.origin.y + (point.y - interaction.start.y), snapStepCm),
              0,
              wallHeightCm - interaction.origin.h
            )

            return { ...cell, x: nextX, y: nextY }
          })
        )
      }

      if (interaction.type === 'resize') {
        setFreeCells((previousCells) =>
          previousCells.map((cell) =>
            cell.id === interaction.cellId
              ? resizeFreeCell(
                  interaction.origin,
                  point,
                  interaction.handle,
                  wallWidthCm,
                  wallHeightCm,
                  snapStepCm
                )
              : cell
          )
        )
      }
    }

    const handleMouseUp = () => {
      if (
        interaction.type === 'drawing' &&
        draftCell &&
        draftCell.w >= MIN_CELL_SIZE_CM &&
        draftCell.h >= MIN_CELL_SIZE_CM
      ) {
        const createdCell = createFacadeCell(interaction.preset.sectionType, {
          ...draftCell,
          presetId: interaction.preset.id,
          label: draftCell.label || interaction.preset.label
        })
        setFreeCells((previousCells) => [...previousCells, createdCell])
        setSelectedCellId(createdCell.id)
      }

      setDraftCell(null)
      setInteraction(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draftCell, getCanvasPoint, interaction, snapStepCm, wallHeightCm, wallWidthCm])

  const handleGridResize = (dimension, value) => {
    const numericValue = Number(value)
    if (Number.isNaN(numericValue) || numericValue <= 0 || !selectedGridPath) return

    const mullionThickness = Number(innerMullionThick) || 5

    if (dimension === 'W' && widthParent) {
      const childNode = selectedGridPath[widthParentIndex + 1]
      const isLeftChild = widthParent.children[0].id === childNode.id
      let nextRatio = ((numericValue + mullionThickness / 2) / widthParent.exactW) * 100
      if (nextRatio > 95) nextRatio = 95
      if (nextRatio < 5) nextRatio = 5
      if (!isLeftChild) nextRatio = 100 - nextRatio

      setGridTree((previousTree) =>
        updateGridNode(previousTree, widthParent.id, (node) => ({
          ...node,
          splitRatio: nextRatio
        }))
      )
    }

    if (dimension === 'H' && heightParent) {
      const childNode = selectedGridPath[heightParentIndex + 1]
      const isTopChild = heightParent.children[0].id === childNode.id
      let nextRatio = ((numericValue + mullionThickness / 2) / heightParent.exactH) * 100
      if (nextRatio > 95) nextRatio = 95
      if (nextRatio < 5) nextRatio = 5
      if (!isTopChild) nextRatio = 100 - nextRatio

      setGridTree((previousTree) =>
        updateGridNode(previousTree, heightParent.id, (node) => ({
          ...node,
          splitRatio: nextRatio
        }))
      )
    }
  }

  const handleGridSplit = (direction) => {
    if (!selectedGridId) return alert('حدد مربعًا أولًا قبل التقسيم.')

    setGridTree((previousTree) =>
      updateGridNode(previousTree, selectedGridId, (node) => {
        if (node.splitType || node.content !== 'empty') return node

        return {
          ...node,
          splitType: direction,
          splitRatio: 50,
          children: [createGridNode(), createGridNode()]
        }
      })
    )
    setSelectedGridId(null)
  }

  const handleGridContent = (contentType) => {
    if (!selectedGridId) return alert('حدد مربعًا أولًا قبل تحديد نوعه.')

    setGridTree((previousTree) =>
      updateGridNode(previousTree, selectedGridId, (node) => {
        if (node.splitType) return node
        if (contentType === 'empty') {
          return { ...node, content: 'empty', presetId: null, label: '' }
        }

        const preset = resolveFacadePreset(selectedPresetId, contentType)

        return {
          ...node,
          content: preset.sectionType,
          presetId: preset.id,
          label: preset.label
        }
      })
    )
  }

  const applySelectedPresetToGrid = () => {
    if (!selectedGridId) return alert('حدد مربعًا أولًا قبل تطبيق العنصر.')
    handleGridContent(selectedPreset.sectionType)
  }

  const handleGridReset = () => {
    setGridTree(createEmptyGridTree())
    setSelectedGridId('root')
  }

  const handleFreeCanvasMouseDown = (event) => {
    if (freeTool !== 'draw') {
      setSelectedCellId(null)
      return
    }

    const point = getCanvasPoint(event.clientX, event.clientY)
    if (!point) return

    setDraftCell({
      type: selectedPreset.sectionType,
      presetId: selectedPreset.id,
      label: selectedPreset.label,
      x: point.x,
      y: point.y,
      w: 0,
      h: 0
    })
    setInteraction({ type: 'drawing', preset: selectedPreset, start: point })
  }

  const handleCellMouseDown = (event, cellId) => {
    if (freeTool !== 'select') return

    event.stopPropagation()
    const point = getCanvasPoint(event.clientX, event.clientY)
    const targetCell = freeCells.find((cell) => cell.id === cellId)
    if (!point || !targetCell) return

    setSelectedCellId(cellId)
    setInteraction({
      type: 'drag',
      cellId,
      start: point,
      origin: { ...targetCell }
    })
  }

  const handleResizeMouseDown = (event, cellId, handle) => {
    if (freeTool !== 'select') return

    event.stopPropagation()
    const point = getCanvasPoint(event.clientX, event.clientY)
    const targetCell = freeCells.find((cell) => cell.id === cellId)
    if (!point || !targetCell) return

    setSelectedCellId(cellId)
    setInteraction({
      type: 'resize',
      cellId,
      handle,
      start: point,
      origin: { ...targetCell }
    })
  }

  const updateSelectedCellMetric = (field, value) => {
    if (!selectedCell) return

    setFreeCells((previousCells) =>
      previousCells.map((cell) => {
        if (cell.id !== selectedCell.id) return cell

        if (field === 'label') {
          return { ...cell, label: value }
        }

        if (field === 'presetId') {
          const preset = resolveFacadePreset(value, cell.type)
          return {
            ...cell,
            presetId: preset.id,
            type: preset.sectionType,
            label: cell.label || preset.label
          }
        }

        const numericValue = Number(value)
        if (Number.isNaN(numericValue)) return cell

        if (field === 'x') {
          const nextX = clamp(snapValue(numericValue, snapStepCm), 0, wallWidthCm - cell.w)
          return { ...cell, x: nextX }
        }

        if (field === 'y') {
          const nextY = clamp(snapValue(numericValue, snapStepCm), 0, wallHeightCm - cell.h)
          return { ...cell, y: nextY }
        }

        if (field === 'w') {
          const nextW = clamp(
            snapValue(numericValue, snapStepCm),
            MIN_CELL_SIZE_CM,
            wallWidthCm - cell.x
          )
          return { ...cell, w: nextW }
        }

        if (field === 'h') {
          const nextH = clamp(
            snapValue(numericValue, snapStepCm),
            MIN_CELL_SIZE_CM,
            wallHeightCm - cell.y
          )
          return { ...cell, h: nextH }
        }

        return cell
      })
    )
  }

  const duplicateSelectedCell = () => {
    if (!selectedCell) return

    const duplicatedCell = createFacadeCell(selectedCell.type, {
      ...selectedCell,
      id: undefined,
      x: clamp(selectedCell.x + snapStepCm, 0, wallWidthCm - selectedCell.w),
      y: clamp(selectedCell.y + snapStepCm, 0, wallHeightCm - selectedCell.h)
    })

    setFreeCells((previousCells) => [...previousCells, duplicatedCell])
    setSelectedCellId(duplicatedCell.id)
  }

  const deleteSelectedCell = () => {
    if (!selectedCellId) return
    setFreeCells((previousCells) => previousCells.filter((cell) => cell.id !== selectedCellId))
    setSelectedCellId(null)
  }

  const resetFreeDesigner = () => {
    setFreeCells([])
    setSelectedCellId(null)
    setDraftCell(null)
    setInteraction(null)
  }

  const handleCompileAndInsert = () => {
    if (preview.blockingIssues.length > 0) {
      return alert(preview.blockingIssues.join('\n'))
    }

    if (onSave) onSave(preview.pieces, preview.glass, preview.accessories, preview.operations)
  }

  const GridNode = ({ node }) => {
    const isSelected = selectedGridId === node.id
    const preset = resolveFacadePreset(node.presetId, node.content === 'fixed' ? 'fixed' : 'sash')

    if (node.splitType === 'V' && node.children?.length === 2) {
      return (
        <div className="flex h-full w-full overflow-hidden rounded-[1.2rem]">
          <div style={{ flexGrow: node.splitRatio, flexBasis: 0 }} className="relative h-full">
            <GridNode node={node.children[0]} />
          </div>
          <div className="z-10 flex h-full w-3 shrink-0 items-center justify-center bg-[#1F2A62] shadow-xl">
            <div className="h-12 w-1 rounded-full bg-white/50" />
          </div>
          <div
            style={{ flexGrow: 100 - node.splitRatio, flexBasis: 0 }}
            className="relative h-full"
          >
            <GridNode node={node.children[1]} />
          </div>
        </div>
      )
    }

    if (node.splitType === 'H' && node.children?.length === 2) {
      return (
        <div className="flex h-full w-full flex-col overflow-hidden rounded-[1.2rem]">
          <div style={{ flexGrow: node.splitRatio, flexBasis: 0 }} className="relative w-full">
            <GridNode node={node.children[0]} />
          </div>
          <div className="z-10 flex h-3 w-full shrink-0 items-center justify-center bg-[#1F2A62] shadow-xl">
            <div className="h-1 w-12 rounded-full bg-white/50" />
          </div>
          <div
            style={{ flexGrow: 100 - node.splitRatio, flexBasis: 0 }}
            className="relative w-full"
          >
            <GridNode node={node.children[1]} />
          </div>
        </div>
      )
    }

    return (
      <div
        onClick={(event) => {
          event.stopPropagation()
          setSelectedGridId(node.id)
        }}
        className={`relative flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-[1.1rem] border transition-all duration-150 ${
          isSelected
            ? 'z-20 border-orange-400 ring-4 ring-orange-300/70'
            : 'border-white/40 hover:border-indigo-300'
        } ${
          node.content === 'fixed'
            ? 'bg-gradient-to-br from-cyan-100 via-sky-50 to-white'
            : node.content === 'sash'
              ? 'bg-gradient-to-br from-indigo-100 via-violet-50 to-white'
              : 'bg-white/45'
        }`}
      >
        <div className="pointer-events-none absolute inset-2 rounded-[0.8rem] border border-white/60 shadow-[inset_0_0_30px_rgba(255,255,255,0.35)]" />

        {node.content === 'empty' && (
          <>
            <span
              className={`text-sm font-black ${isSelected ? 'text-orange-600' : 'text-slate-400'}`}
            >
              {isSelected ? 'محدد' : 'فارغ'}
            </span>
            <span className="mt-1 text-[11px] font-bold text-slate-400" dir="ltr">
              {node.exactW?.toFixed(1)} × {node.exactH?.toFixed(1)} سم
            </span>
          </>
        )}

        {node.content === 'sash' && (
          <div className="m-2 flex h-[88%] w-[88%] flex-col items-center justify-center rounded-[0.8rem] border border-indigo-200 bg-white/60 p-2">
            <FacadePresetIllustration
              presetId={preset.id}
              fallbackType="sash"
              className="h-full w-full"
            />
            <span className="mt-1 text-[11px] font-black text-indigo-700">
              {node.label || preset.shortLabel}
            </span>
          </div>
        )}

        {node.content === 'fixed' && (
          <div className="m-2 flex h-[88%] w-[88%] flex-col items-center justify-center rounded-[0.8rem] border border-cyan-200 bg-white/60 p-2">
            <FacadePresetIllustration
              presetId={preset.id}
              fallbackType="fixed"
              className="h-full w-full"
            />
            <span className="mt-1 text-[11px] font-black text-cyan-800">
              {node.label || preset.shortLabel}
            </span>
            <span className="mt-1 text-[11px] font-bold text-cyan-800" dir="ltr">
              {node.exactW?.toFixed(1)} × {node.exactH?.toFixed(1)} سم
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex flex-col gap-5 border-b border-slate-100 pb-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-black text-[#22306A]">
            <Layout size={24} /> مصمم الواجهات الإنتاجي
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-bold text-slate-500">
            رسم شبكي أو حر، ثم تحويل مباشر إلى قطع وألواح زجاج واكسسوارات مع معاينة جاهزية المخزون
            قبل الإدراج في المقاييسة.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => (designMode === 'grid' ? handleGridReset() : resetFreeDesigner())}
            className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-600 transition-all hover:bg-slate-200"
          >
            <RefreshCw size={16} /> مسح الرسم الحالي
          </button>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="rounded-[1.6rem] border border-indigo-100 bg-indigo-50/70 p-4">
            <label className="mb-2 block text-xs font-black text-[#34458A]">القطاع الرئيسي</label>
            <select
              className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-[#5C54A4]"
              value={selectedProfileId}
              onChange={(event) => setSelectedProfileId(event.target.value)}
            >
              <option value="">اختر القطاع</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <input
                type="text"
                className="rounded-xl border border-indigo-100 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-[#5C54A4]"
                placeholder="اسم الواجهة"
                value={windowLabel}
                onChange={(event) => setWindowLabel(event.target.value)}
              />
              <input
                type="text"
                className="rounded-xl border border-indigo-100 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-[#5C54A4]"
                placeholder="العدد"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#22306A]">
              <Wrench size={16} /> إعدادات عامة
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  العرض الكلي
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-center font-black outline-none focus:border-[#5C54A4]"
                  value={wallSize.width}
                  onChange={(event) =>
                    setWallSize((previous) => ({ ...previous, width: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  الارتفاع الكلي
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-center font-black outline-none focus:border-[#5C54A4]"
                  value={wallSize.height}
                  onChange={(event) =>
                    setWallSize((previous) => ({ ...previous, height: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  سماكة الإطار الخارجي
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-center font-black outline-none focus:border-[#5C54A4]"
                  value={outerFrameThick}
                  onChange={(event) => setOuterFrameThick(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  سماكة القاطع الداخلي
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-center font-black outline-none focus:border-[#5C54A4]"
                  value={innerMullionThick}
                  onChange={(event) => setInnerMullionThick(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-[#D5D4F2] bg-[#F4F3FF] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#3E3A85]">
              <ScanLine size={16} /> أسلوب الرسم
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDesignMode('grid')}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition-all ${
                  designMode === 'grid'
                    ? 'bg-[#5C54A4] text-white shadow-lg'
                    : 'bg-white text-[#5C54A4] hover:bg-indigo-50'
                }`}
              >
                رسم شبكي
              </button>
              <button
                onClick={() => setDesignMode('free')}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition-all ${
                  designMode === 'free'
                    ? 'bg-[#5C54A4] text-white shadow-lg'
                    : 'bg-white text-[#5C54A4] hover:bg-indigo-50'
                }`}
              >
                رسم حر
              </button>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black text-[#22306A]">مكتبة العناصر المرئية</div>
                <div className="text-[11px] font-bold text-slate-500">
                  اختر نوع العنصر ثم ارسمه أو أضفه مباشرة للوحة.
                </div>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">
                {selectedPreset.label}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {facadePresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`rounded-2xl border p-3 text-right transition-all ${
                    selectedPresetId === preset.id
                      ? 'border-[#5C54A4] bg-indigo-50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-white'
                  }`}
                >
                  <div className="mb-2 flex h-20 items-center justify-center rounded-xl bg-white">
                    <FacadePresetIllustration
                      presetId={preset.id}
                      fallbackType={preset.sectionType}
                      className="h-16 w-16"
                    />
                  </div>
                  <div className="text-xs font-black text-[#22306A]">{preset.label}</div>
                  <div className="mt-1 text-[10px] font-bold text-slate-500">
                    {preset.defaultWidth} × {preset.defaultHeight} سم
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {designMode === 'free' ? (
                <>
                  <button
                    onClick={() => addPresetToCanvas()}
                    className="rounded-xl bg-[#22306A] px-3 py-3 text-xs font-black text-white hover:bg-[#1A2552]"
                  >
                    إضافة العنصر المختار
                  </button>
                  <button
                    onClick={() => setFreeTool('draw')}
                    className={`rounded-xl px-3 py-3 text-xs font-black transition-all ${
                      freeTool === 'draw'
                        ? 'bg-orange-500 text-white'
                        : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                    }`}
                  >
                    ارسم العنصر المختار
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={applySelectedPresetToGrid}
                    className="rounded-xl bg-[#22306A] px-3 py-3 text-xs font-black text-white hover:bg-[#1A2552]"
                  >
                    تطبيق العنصر على المحدد
                  </button>
                  <button
                    onClick={() => handleGridContent('empty')}
                    className="rounded-xl bg-red-50 px-3 py-3 text-xs font-black text-red-700 hover:bg-red-100"
                  >
                    تفريغ المحدد
                  </button>
                </>
              )}
            </div>
          </div>

          {designMode === 'grid' ? (
            <>
              <div className="rounded-[1.6rem] border border-blue-100 bg-blue-50/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-blue-800">
                  <Grid size={16} /> أدوات التقسيم الشبكي
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleGridSplit('V')}
                    className="flex flex-col items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-3 text-xs font-black text-[#22306A] hover:border-[#5C54A4]"
                  >
                    <Columns size={16} /> تقسيم رأسي
                  </button>
                  <button
                    onClick={() => handleGridSplit('H')}
                    className="flex flex-col items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-3 text-xs font-black text-[#22306A] hover:border-[#5C54A4]"
                  >
                    <Rows size={16} /> تقسيم أفقي
                  </button>
                </div>

                <div className="mt-3 rounded-xl border border-blue-100 bg-white px-3 py-3 text-xs font-bold text-slate-500">
                  اختر الشكل من مكتبة العناصر أعلاه ثم اضغط «تطبيق العنصر على المحدد».
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-orange-100 bg-orange-50/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-orange-700">
                  <SlidersHorizontal size={16} /> ضبط الفتحة المحددة
                </div>

                {selectedGridNode ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-500">
                        العرض الصافي
                      </label>
                      <input
                        type="text"
                        disabled={!canEditWidth}
                        className={`w-full rounded-xl border px-3 py-3 text-center font-black outline-none ${
                          canEditWidth
                            ? 'border-orange-200 bg-white text-orange-700 focus:border-orange-500'
                            : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        }`}
                        value={
                          selectedGridNode.exactW ? Number(selectedGridNode.exactW.toFixed(1)) : ''
                        }
                        onChange={(event) => handleGridResize('W', event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-500">
                        الارتفاع الصافي
                      </label>
                      <input
                        type="text"
                        disabled={!canEditHeight}
                        className={`w-full rounded-xl border px-3 py-3 text-center font-black outline-none ${
                          canEditHeight
                            ? 'border-orange-200 bg-white text-orange-700 focus:border-orange-500'
                            : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        }`}
                        value={
                          selectedGridNode.exactH ? Number(selectedGridNode.exactH.toFixed(1)) : ''
                        }
                        onChange={(event) => handleGridResize('H', event.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-white px-3 py-5 text-center text-xs font-bold text-slate-400">
                    اختر مربعًا داخليًا أولًا.
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="rounded-[1.6rem] border border-blue-100 bg-blue-50/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-blue-800">
                  <Move size={16} /> أدوات الرسم الحر
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setFreeTool('select')}
                    className={`rounded-xl px-3 py-3 text-xs font-black transition-all ${
                      freeTool === 'select'
                        ? 'bg-[#5C54A4] text-white'
                        : 'bg-white text-[#22306A] hover:border-[#5C54A4]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <MousePointer2 size={14} /> تحديد
                    </div>
                  </button>
                  <button
                    onClick={() => setFreeTool('draw')}
                    className={`rounded-xl px-3 py-3 text-xs font-black transition-all ${
                      freeTool === 'draw'
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-orange-700 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Square size={14} /> رسم
                    </div>
                  </button>
                  <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-3 text-[11px] font-black text-slate-500">
                    {selectedPreset.shortLabel}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">
                    شبكة الالتقاط (سم)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-center font-black outline-none focus:border-[#5C54A4]"
                    value={snapGridCm}
                    onChange={(event) => setSnapGridCm(event.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-orange-100 bg-orange-50/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-orange-700">
                  <SlidersHorizontal size={16} /> خصائص العنصر المحدد
                </div>

                {selectedCell ? (
                  <div className="space-y-3">
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-black outline-none focus:border-[#5C54A4]"
                      value={selectedCell.presetId || defaultPresetId}
                      onChange={(event) => updateSelectedCellMetric('presetId', event.target.value)}
                    >
                      {facadePresets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-[#5C54A4]"
                      placeholder="اسم العنصر"
                      value={selectedCell.label || ''}
                      onChange={(event) => updateSelectedCellMetric('label', event.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center font-black outline-none focus:border-[#5C54A4]"
                        value={selectedCell.x}
                        onChange={(event) => updateSelectedCellMetric('x', event.target.value)}
                      />
                      <input
                        type="text"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center font-black outline-none focus:border-[#5C54A4]"
                        value={selectedCell.y}
                        onChange={(event) => updateSelectedCellMetric('y', event.target.value)}
                      />
                      <input
                        type="text"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center font-black outline-none focus:border-[#5C54A4]"
                        value={selectedCell.w}
                        onChange={(event) => updateSelectedCellMetric('w', event.target.value)}
                      />
                      <input
                        type="text"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center font-black outline-none focus:border-[#5C54A4]"
                        value={selectedCell.h}
                        onChange={(event) => updateSelectedCellMetric('h', event.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={duplicateSelectedCell}
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-black text-slate-700 hover:border-[#5C54A4]"
                      >
                        <Copy size={14} /> نسخ
                      </button>
                      <button
                        onClick={deleteSelectedCell}
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-3 text-xs font-black text-red-600 hover:border-red-400"
                      >
                        <Trash2 size={14} /> حذف
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-white px-3 py-5 text-center text-xs font-bold text-slate-400">
                    اختر عنصرًا من اللوحة الحرة لتعديل أبعاده أو نوعه.
                  </div>
                )}
              </div>
            </>
          )}

          <button
            onClick={handleCompileAndInsert}
            className="flex w-full items-center justify-center gap-3 rounded-[1.6rem] bg-green-600 px-5 py-4 text-lg font-black text-white shadow-lg transition-all hover:bg-green-700"
          >
            <CheckCircle2 size={20} /> إدراج إلى المقاييسة ومحرك القص
          </button>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef3ff_100%)] p-5 shadow-inner">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-[#22306A]">
                  {designMode === 'grid' ? 'لوحة التصميم الشبكي' : 'لوحة الرسم الحر'}
                </h3>
                <p className="text-xs font-bold text-slate-500">
                  {designMode === 'grid'
                    ? 'أنسب للواجهات المنظمة والقطاعات المتكررة.'
                    : 'ارسم الفتحات بحرية ثم حرّكها وعدّل أبعادها مع الالتقاط على شبكة.'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-500">
                {wallWidthCm} × {wallHeightCm} سم
              </div>
            </div>

            <div
              className="mx-auto w-full max-w-5xl overflow-hidden rounded-[1.8rem] border-[10px] border-slate-800 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]"
              style={{ aspectRatio: `${wallWidthCm} / ${wallHeightCm}` }}
            >
              {designMode === 'grid' ? (
                <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.85),transparent_30%),linear-gradient(135deg,#edf3ff_0%,#dde8ff_50%,#f8fbff_100%)] p-2">
                  <GridNode node={annotatedTree} />
                </div>
              ) : (
                <div
                  ref={canvasRef}
                  onMouseDown={handleFreeCanvasMouseDown}
                  className="relative h-full w-full cursor-crosshair overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_35%),linear-gradient(135deg,#eef5ff_0%,#dce7ff_50%,#f9fbff_100%)]"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(92,84,164,0.12) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(92,84,164,0.12) 1px, transparent 1px),
                      radial-gradient(circle at top right, rgba(255,255,255,0.92), transparent 35%),
                      linear-gradient(135deg, #eef5ff 0%, #dce7ff 50%, #f9fbff 100%)
                    `,
                    backgroundSize: `
                      ${(snapStepCm / wallWidthCm) * 100}% 100%,
                      100% ${(snapStepCm / wallHeightCm) * 100}%,
                      auto,
                      auto
                    `
                  }}
                >
                  {freeCells.map((cell) => {
                    const meta = cellTypeMeta[cell.type] || cellTypeMeta.sash
                    const isSelected = cell.id === selectedCellId
                    const preset = resolveFacadePreset(cell.presetId, cell.type)

                    return (
                      <div
                        key={cell.id}
                        onMouseDown={(event) => handleCellMouseDown(event, cell.id)}
                        className={`absolute overflow-hidden rounded-[1rem] border-[3px] shadow-lg transition-all ${
                          meta.border
                        } ${isSelected ? 'ring-4 ring-amber-300/80' : ''} bg-gradient-to-br ${meta.fill}`}
                        style={{
                          left: `${(cell.x / wallWidthCm) * 100}%`,
                          top: `${(cell.y / wallHeightCm) * 100}%`,
                          width: `${(cell.w / wallWidthCm) * 100}%`,
                          height: `${(cell.h / wallHeightCm) * 100}%`
                        }}
                      >
                        <div className="absolute inset-2 rounded-[0.8rem] border border-white/70 bg-white/15 backdrop-blur-[1px]" />
                        <div className="relative z-10 flex h-full flex-col justify-between p-2">
                          <div className="flex h-[70%] items-center justify-center rounded-[0.8rem] bg-white/60 p-1">
                            <FacadePresetIllustration
                              presetId={preset.id}
                              fallbackType={cell.type}
                              className="h-full w-full"
                            />
                          </div>
                          <div className={`text-[11px] font-black ${meta.text}`}>
                            {cell.label || preset.label || meta.label}
                          </div>
                          <div className={`text-[10px] font-bold ${meta.text}`} dir="ltr">
                            {cell.w.toFixed(0)} × {cell.h.toFixed(0)} سم
                          </div>
                        </div>

                        {isSelected &&
                          ['tl', 'tr', 'bl', 'br'].map((handle) => {
                            const positions = {
                              tl: 'left-1 top-1 cursor-nwse-resize',
                              tr: 'right-1 top-1 cursor-nesw-resize',
                              bl: 'bottom-1 left-1 cursor-nesw-resize',
                              br: 'bottom-1 right-1 cursor-nwse-resize'
                            }

                            return (
                              <button
                                key={handle}
                                type="button"
                                onMouseDown={(event) =>
                                  handleResizeMouseDown(event, cell.id, handle)
                                }
                                className={`absolute h-4 w-4 rounded-full border-2 border-white bg-[#22306A] ${positions[handle]}`}
                              />
                            )
                          })}
                      </div>
                    )
                  })}

                  {draftCell && (
                    <div
                      className={`pointer-events-none absolute rounded-[1rem] border-[3px] border-dashed ${
                        draftCell.type === 'fixed'
                          ? 'border-cyan-500 bg-cyan-300/15'
                          : 'border-indigo-500 bg-indigo-300/15'
                      }`}
                      style={{
                        left: `${(draftCell.x / wallWidthCm) * 100}%`,
                        top: `${(draftCell.y / wallHeightCm) * 100}%`,
                        width: `${(draftCell.w / wallWidthCm) * 100}%`,
                        height: `${(draftCell.h / wallHeightCm) * 100}%`
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-black text-slate-500">الفتحات المتحركة</div>
              <div className="mt-2 text-3xl font-black text-[#22306A]">
                {preview.stats.sashCount}
              </div>
            </div>
            <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-black text-slate-500">الفتحات الثابتة</div>
              <div className="mt-2 text-3xl font-black text-cyan-700">
                {preview.stats.fixedCount}
              </div>
            </div>
            <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-black text-slate-500">القواطع الداخلية</div>
              <div className="mt-2 text-3xl font-black text-violet-700">
                {preview.stats.horizontalMullions + preview.stats.verticalMullions}
              </div>
            </div>
            <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-black text-slate-500">تغطية الواجهة</div>
              <div className="mt-2 text-3xl font-black text-emerald-700">
                {preview.stats.coveragePercent.toFixed(1)}%
              </div>
            </div>
          </div>

          {(preview.blockingIssues.length > 0 || preview.warnings.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.6rem] border border-red-200 bg-red-50 p-4">
                <div className="mb-2 text-sm font-black text-red-700">
                  أمور يجب حلها قبل الإدراج
                </div>
                {preview.blockingIssues.length === 0 ? (
                  <div className="text-xs font-bold text-red-300">لا يوجد.</div>
                ) : (
                  <div className="space-y-2">
                    {preview.blockingIssues.map((issue) => (
                      <div
                        key={issue}
                        className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-red-700"
                      >
                        {issue}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 text-sm font-black text-amber-700">ملاحظات تشغيلية</div>
                {preview.warnings.length === 0 ? (
                  <div className="text-xs font-bold text-amber-400">
                    لا توجد ملاحظات. التصميم جاهز للانتقال إلى القص.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {preview.warnings.map((warning) => (
                      <div
                        key={warning}
                        className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-amber-700"
                      >
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2 text-lg font-black text-[#22306A]">
              <Boxes size={20} /> معاينة الربط مع المخزون والإنتاج
            </div>

            <div className="mb-4 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-[11px] font-black text-slate-500">قطع الألومنيوم</div>
                <div className="mt-2 text-2xl font-black text-[#22306A]">
                  {preview.pieces.reduce((total, item) => total + item.quantity, 0)}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-[11px] font-black text-slate-500">ألواح الزجاج</div>
                <div className="mt-2 text-2xl font-black text-cyan-700">
                  {preview.glass.reduce((total, item) => total + item.quantity, 0)}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-[11px] font-black text-slate-500">الاكسسوارات</div>
                <div className="mt-2 text-2xl font-black text-violet-700">
                  {preview.accessories.reduce((total, item) => total + item.quantity, 0)}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-[11px] font-black text-slate-500">التشغيل والورشة</div>
                <div className="mt-2 text-2xl font-black text-emerald-700">
                  {preview.operations.reduce((total, item) => total + item.quantity, 0)}
                </div>
              </div>
            </div>

            {preview.inventoryPreview.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm font-bold text-slate-400">
                اختر قطاعًا وابدأ الرسم لتظهر المعاينة الإنتاجية.
              </div>
            ) : (
              <div className="space-y-3">
                {preview.inventoryPreview.map((previewItem) => {
                  const hasShortage =
                    previewItem.shortage !== null &&
                    previewItem.shortage !== undefined &&
                    previewItem.shortage > 0

                  return (
                    <div
                      key={`${previewItem.type}-${previewItem.inventoryId}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-sm font-black text-[#22306A]">
                            {previewItem.label}
                          </div>
                          <div className="mt-1 text-xs font-bold text-slate-500">
                            {renderPreviewValue(previewItem)}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                          <span className="rounded-full bg-white px-3 py-2 text-slate-600">
                            المطلوب: {previewItem.estimatedStockUse ?? '-'} {previewItem.unitLabel}
                          </span>
                          <span className="rounded-full bg-white px-3 py-2 text-slate-600">
                            المتاح: {previewItem.stockQty ?? '-'}
                          </span>
                          <span
                            className={`rounded-full px-3 py-2 ${
                              hasShortage
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {hasShortage ? `عجز: ${previewItem.shortage}` : 'جاهز مبدئيًا'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VisualDesigner
