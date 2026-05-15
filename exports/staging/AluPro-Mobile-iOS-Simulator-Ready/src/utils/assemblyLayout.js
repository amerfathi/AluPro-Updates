import { parseArabicNum } from './number.js'
import { compileTechnicalSystemLayout } from './technicalSystem.js'

const createId = () => Math.random().toString(36).slice(2, 11)
const round = (value, digits = 3) => Number(Number(value || 0).toFixed(digits))
const toNumber = (value, fallback = 0) => {
  const parsed = Number(parseArabicNum(value))
  return Number.isFinite(parsed) ? parsed : fallback
}

export const assemblyTemplates = [
  {
    id: 'single-fixed',
    label: 'ثابت مفرد',
    rows: [100],
    columns: [100],
    modules: [{ row: 0, col: 0, rowSpan: 1, colSpan: 1, type: 'fixed', label: 'ثابت رئيسي' }]
  },
  {
    id: 'single-sash',
    label: 'متحرك مفرد',
    rows: [100],
    columns: [100],
    modules: [{ row: 0, col: 0, rowSpan: 1, colSpan: 1, type: 'sash', label: 'درفة رئيسية' }]
  },
  {
    id: 'fixed-sash-side',
    label: 'ثابت + متحرك جانبي',
    rows: [100],
    columns: [38, 62],
    modules: [
      { row: 0, col: 0, rowSpan: 1, colSpan: 1, type: 'fixed', label: 'ثابت جانبي' },
      { row: 0, col: 1, rowSpan: 1, colSpan: 1, type: 'sash', label: 'متحرك جانبي' }
    ]
  },
  {
    id: 'sash-fixed-side',
    label: 'متحرك + ثابت جانبي',
    rows: [100],
    columns: [62, 38],
    modules: [
      { row: 0, col: 0, rowSpan: 1, colSpan: 1, type: 'sash', label: 'متحرك رئيسي' },
      { row: 0, col: 1, rowSpan: 1, colSpan: 1, type: 'fixed', label: 'ثابت جانبي' }
    ]
  },
  {
    id: 'top-fixed-bottom-sash',
    label: 'ثابت علوي + متحرك سفلي',
    rows: [28, 72],
    columns: [100],
    modules: [
      { row: 0, col: 0, rowSpan: 1, colSpan: 1, type: 'fixed', label: 'ثابت علوي' },
      { row: 1, col: 0, rowSpan: 1, colSpan: 1, type: 'sash', label: 'متحرك سفلي' }
    ]
  },
  {
    id: 'fixed-sash-fixed',
    label: 'ثابت + متحرك + ثابت',
    rows: [100],
    columns: [22, 56, 22],
    modules: [
      { row: 0, col: 0, rowSpan: 1, colSpan: 1, type: 'fixed', label: 'ثابت يمين' },
      { row: 0, col: 1, rowSpan: 1, colSpan: 1, type: 'sash', label: 'متحرك وسط' },
      { row: 0, col: 2, rowSpan: 1, colSpan: 1, type: 'fixed', label: 'ثابت يسار' }
    ]
  }
]

export const createAssemblyModule = (overrides = {}) => ({
  id: overrides.id || createId(),
  label: overrides.label || 'وحدة جديدة',
  type: overrides.type || 'sash',
  profileId: overrides.profileId || '',
  row: overrides.row ?? 0,
  col: overrides.col ?? 0,
  rowSpan: overrides.rowSpan ?? 1,
  colSpan: overrides.colSpan ?? 1
})

export const createAssemblyStateFromTemplate = (
  templateId = 'single-sash',
  width = 2.4,
  height = 2.2
) => {
  const template =
    assemblyTemplates.find((currentTemplate) => currentTemplate.id === templateId) ||
    assemblyTemplates[1]
  const safeWidth = Math.max(0, toNumber(width, 2.4))
  const safeHeight = Math.max(0, toNumber(height, 2.2))

  return {
    templateId: template.id,
    frameProfileId: '',
    rows: template.rows.map((ratio, index) => ({
      id: `row-${index + 1}`,
      size: round((safeHeight * Number(ratio)) / 100, 3).toFixed(3)
    })),
    columns: template.columns.map((ratio, index) => ({
      id: `col-${index + 1}`,
      size: round((safeWidth * Number(ratio)) / 100, 3).toFixed(3)
    })),
    modules: template.modules.map((module) => createAssemblyModule(module))
  }
}

const buildScaledTrackSizes = (tracks, totalValue, trackName, warnings) => {
  const safeTracks = (tracks || []).map((track, index) => ({
    id: track.id || `${trackName}-${index + 1}`,
    size: Math.max(0, toNumber(track.size, 0))
  }))

  if (safeTracks.length === 0) {
    return { scaledTracks: [], totalSize: 0 }
  }

  const rawTotal = safeTracks.reduce((sum, track) => sum + track.size, 0)
  if (rawTotal <= 0 || totalValue <= 0) {
    return {
      scaledTracks: safeTracks.map((track) => ({ ...track, actual: 0 })),
      totalSize: 0
    }
  }

  const scaleFactor = totalValue / rawTotal
  if (Math.abs(rawTotal - totalValue) > 0.01) {
    warnings.push(
      `تمت مواءمة ${trackName} تلقائيًا مع المقاس الكلي لأن مجموع القيم (${rawTotal.toFixed(3)}م) لا يساوي ${totalValue.toFixed(3)}م.`
    )
  }

  return {
    scaledTracks: safeTracks.map((track) => ({
      ...track,
      actual: round(track.size * scaleFactor, 3)
    })),
    totalSize: round(totalValue, 3)
  }
}

const annotateTrackOffsets = (tracks = []) => {
  let cursor = 0
  return tracks.map((track, index) => {
    const actual = Number(track.actual) || 0
    const start = round(cursor, 3)
    cursor += actual

    return {
      ...track,
      index,
      start,
      end: round(cursor, 3)
    }
  })
}

const resolveTrackRange = (tracks, start, span) => {
  const first = tracks[start]
  const last = tracks[start + span - 1]

  if (!first || !last) {
    return {
      start: 0,
      end: 0,
      size: 0
    }
  }

  return {
    start: Number(first.start) || 0,
    end: Number(last.end) || 0,
    size: round((Number(last.end) || 0) - (Number(first.start) || 0), 3)
  }
}

const buildOccupancyMatrix = (rowCount, columnCount, modules, errors) => {
  const occupancy = Array.from({ length: rowCount }, () =>
    Array.from({ length: columnCount }, () => null)
  )

  modules.forEach((module) => {
    const maxRow = module.row + module.rowSpan
    const maxCol = module.col + module.colSpan

    if (
      module.row < 0 ||
      module.col < 0 ||
      module.rowSpan <= 0 ||
      module.colSpan <= 0 ||
      maxRow > rowCount ||
      maxCol > columnCount
    ) {
      errors.push(`الوحدة "${module.label}" خارج حدود شبكة التجميعة.`)
      return
    }

    for (let rowIndex = module.row; rowIndex < maxRow; rowIndex += 1) {
      for (let columnIndex = module.col; columnIndex < maxCol; columnIndex += 1) {
        if (occupancy[rowIndex][columnIndex]) {
          errors.push(`يوجد تداخل بين الوحدات داخل الخلية (${rowIndex + 1}, ${columnIndex + 1}).`)
          return
        }
        occupancy[rowIndex][columnIndex] = module.id
      }
    }
  })

  return occupancy
}

const buildMullionSegments = (occupancy, rows, columns) => {
  const verticalSegments = []
  const horizontalSegments = []

  for (let boundaryIndex = 0; boundaryIndex < columns.length - 1; boundaryIndex += 1) {
    let activeLength = 0
    let activeStartRow = null

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const hasLeft = Boolean(occupancy[rowIndex]?.[boundaryIndex])
      const hasRight = Boolean(occupancy[rowIndex]?.[boundaryIndex + 1])

      if (hasLeft && hasRight) {
        if (activeStartRow === null) activeStartRow = rowIndex
        activeLength += Number(rows[rowIndex]?.actual) || 0
      } else if (activeLength > 0) {
        verticalSegments.push({
          id: `v-${boundaryIndex}-${activeStartRow}-${rowIndex - 1}`,
          orientation: 'vertical',
          x: round(columns[boundaryIndex]?.end || 0, 3),
          start: round(rows[activeStartRow]?.start || 0, 3),
          end: round(rows[rowIndex - 1]?.end || 0, 3),
          length: round(activeLength, 3)
        })
        activeLength = 0
        activeStartRow = null
      }
    }

    if (activeLength > 0) {
      verticalSegments.push({
        id: `v-${boundaryIndex}-${activeStartRow}-${rows.length - 1}`,
        orientation: 'vertical',
        x: round(columns[boundaryIndex]?.end || 0, 3),
        start: round(rows[activeStartRow]?.start || 0, 3),
        end: round(rows[rows.length - 1]?.end || 0, 3),
        length: round(activeLength, 3)
      })
    }
  }

  for (let boundaryIndex = 0; boundaryIndex < rows.length - 1; boundaryIndex += 1) {
    let activeLength = 0
    let activeStartColumn = null

    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      const hasTop = Boolean(occupancy[boundaryIndex]?.[columnIndex])
      const hasBottom = Boolean(occupancy[boundaryIndex + 1]?.[columnIndex])

      if (hasTop && hasBottom) {
        if (activeStartColumn === null) activeStartColumn = columnIndex
        activeLength += Number(columns[columnIndex]?.actual) || 0
      } else if (activeLength > 0) {
        horizontalSegments.push({
          id: `h-${boundaryIndex}-${activeStartColumn}-${columnIndex - 1}`,
          orientation: 'horizontal',
          y: round(rows[boundaryIndex]?.end || 0, 3),
          start: round(columns[activeStartColumn]?.start || 0, 3),
          end: round(columns[columnIndex - 1]?.end || 0, 3),
          length: round(activeLength, 3)
        })
        activeLength = 0
        activeStartColumn = null
      }
    }

    if (activeLength > 0) {
      horizontalSegments.push({
        id: `h-${boundaryIndex}-${activeStartColumn}-${columns.length - 1}`,
        orientation: 'horizontal',
        y: round(rows[boundaryIndex]?.end || 0, 3),
        start: round(columns[activeStartColumn]?.start || 0, 3),
        end: round(columns[columns.length - 1]?.end || 0, 3),
        length: round(activeLength, 3)
      })
    }
  }

  return {
    mullionsH: verticalSegments.map((segment) => segment.length),
    mullionsW: horizontalSegments.map((segment) => segment.length),
    verticalSegments,
    horizontalSegments
  }
}

const createEmptyResult = ({
  errors = [],
  warnings = [],
  modulesPreview = [],
  visualModel = null,
  stats = null
}) => ({
  pieces: [],
  glass: [],
  accessories: [],
  operations: [],
  errors,
  warnings,
  stats,
  modulesPreview,
  visualModel
})

export const compileAssemblyGrid = ({
  width,
  height,
  quantity,
  label,
  frameProfile,
  profiles = [],
  rows = [],
  columns = [],
  modules = []
}) => {
  const warnings = []
  const errors = []
  const wallWidth = Math.max(0, toNumber(width, 0))
  const wallHeight = Math.max(0, toNumber(height, 0))
  const qtyMultiplier = Math.max(1, parseInt(toNumber(quantity, 1), 10) || 1)
  const safeLabel = String(label || 'تجميعة').trim() || 'تجميعة'

  if (wallWidth <= 0 || wallHeight <= 0) {
    return createEmptyResult({
      errors: ['يرجى إدخال العرض والارتفاع الكليين للتجميعة بشكل صحيح.']
    })
  }

  const { scaledTracks: scaledRows } = buildScaledTrackSizes(rows, wallHeight, 'الصفوف', warnings)
  const { scaledTracks: scaledColumns } = buildScaledTrackSizes(
    columns,
    wallWidth,
    'الأعمدة',
    warnings
  )
  const rowTracks = annotateTrackOffsets(scaledRows)
  const columnTracks = annotateTrackOffsets(scaledColumns)

  if (rowTracks.length === 0 || columnTracks.length === 0) {
    return createEmptyResult({
      errors: ['أضف صفًا واحدًا وعمودًا واحدًا على الأقل داخل التجميعة.']
    })
  }

  const normalizedModules = (modules || []).map((module, index) =>
    createAssemblyModule({
      ...module,
      label: module.label || `وحدة ${index + 1}`
    })
  )

  if (normalizedModules.length === 0) {
    errors.push('أضف وحدة واحدة على الأقل داخل التجميعة قبل الإدراج.')
  }

  const occupancy = buildOccupancyMatrix(
    rowTracks.length,
    columnTracks.length,
    normalizedModules,
    errors
  )

  const modulesPreview = normalizedModules.map((module) => {
    const horizontalRange = resolveTrackRange(columnTracks, module.col, module.colSpan)
    const verticalRange = resolveTrackRange(rowTracks, module.row, module.rowSpan)

    return {
      ...module,
      x: horizontalRange.start,
      xEnd: horizontalRange.end,
      y: verticalRange.start,
      yEnd: verticalRange.end,
      w: horizontalRange.size,
      h: verticalRange.size,
      profile: profiles.find((profile) => String(profile.id) === String(module.profileId)) || null
    }
  })

  modulesPreview.forEach((module) => {
    if (module.w <= 0 || module.h <= 0) {
      errors.push(`الوحدة "${module.label}" ليس لها مقاس صالح بعد توزيع الصفوف والأعمدة.`)
    }
    if (!module.profile) {
      errors.push(`الوحدة "${module.label}" غير مرتبطة بنظام فني.`)
    }
  })

  if (!frameProfile) {
    errors.push('اختر نظام الإطار والقواطع للتجميعة قبل الإدراج.')
  }

  const mullionData = occupancy
    ? buildMullionSegments(occupancy, rowTracks, columnTracks)
    : {
        mullionsH: [],
        mullionsW: [],
        verticalSegments: [],
        horizontalSegments: []
      }
  const { mullionsH, mullionsW } = mullionData
  const coveragePercent = round(
    (modulesPreview.reduce((sum, module) => sum + module.w * module.h, 0) /
      (wallWidth * wallHeight)) *
      100,
    1
  )

  if (coveragePercent < 100) {
    warnings.push(
      `تغطي الوحدات الحالية ${coveragePercent}% فقط من مساحة التجميعة. الخلايا الفارغة لن تنتج زجاجًا أو قطاعات داخلية.`
    )
  }

  const visualModel = {
    wallWidth,
    wallHeight,
    rows: rowTracks,
    columns: columnTracks,
    modules: modulesPreview,
    mullions: {
      vertical: mullionData.verticalSegments,
      horizontal: mullionData.horizontalSegments
    },
    structuralPieces: [
      {
        id: 'frame-top',
        label: 'حلق علوي',
        orientation: 'horizontal',
        length: round(wallWidth, 3),
        start: 0,
        end: round(wallWidth, 3),
        offset: 0,
        systemName: frameProfile?.name || ''
      },
      {
        id: 'frame-bottom',
        label: 'حلق سفلي',
        orientation: 'horizontal',
        length: round(wallWidth, 3),
        start: 0,
        end: round(wallWidth, 3),
        offset: round(wallHeight, 3),
        systemName: frameProfile?.name || ''
      },
      {
        id: 'frame-right',
        label: 'قائم يمين',
        orientation: 'vertical',
        length: round(wallHeight, 3),
        start: 0,
        end: round(wallHeight, 3),
        offset: 0,
        systemName: frameProfile?.name || ''
      },
      {
        id: 'frame-left',
        label: 'قائم يسار',
        orientation: 'vertical',
        length: round(wallHeight, 3),
        start: 0,
        end: round(wallHeight, 3),
        offset: round(wallWidth, 3),
        systemName: frameProfile?.name || ''
      },
      ...mullionData.verticalSegments.map((segment, index) => ({
        id: `mullion-v-${index + 1}`,
        label: `قاطع رأسي ${index + 1}`,
        orientation: 'vertical',
        length: segment.length,
        start: segment.start,
        end: segment.end,
        offset: segment.x,
        systemName: frameProfile?.name || ''
      })),
      ...mullionData.horizontalSegments.map((segment, index) => ({
        id: `mullion-h-${index + 1}`,
        label: `قاطع أفقي ${index + 1}`,
        orientation: 'horizontal',
        length: segment.length,
        start: segment.start,
        end: segment.end,
        offset: segment.y,
        systemName: frameProfile?.name || ''
      }))
    ],
    coveragePercent
  }

  const stats = {
    modulesCount: modulesPreview.length,
    fixedCount: modulesPreview.filter((module) => module.type === 'fixed').length,
    sashCount: modulesPreview.filter((module) => module.type === 'sash').length,
    verticalMullions: mullionsH.length,
    horizontalMullions: mullionsW.length,
    coveragePercent
  }

  if (errors.length > 0) {
    return createEmptyResult({
      errors,
      warnings,
      modulesPreview,
      visualModel,
      stats
    })
  }

  const layoutData = {
    wallWidthM: wallWidth,
    wallHeightM: wallHeight,
    mullionsH,
    mullionsW,
    fixed: modulesPreview
      .filter((module) => module.type === 'fixed')
      .map((module) => ({ id: module.id, label: module.label, w: module.w, h: module.h })),
    sashes: modulesPreview
      .filter((module) => module.type === 'sash')
      .map((module) => ({ id: module.id, label: module.label, w: module.w, h: module.h }))
  }

  const compiledFrame = compileTechnicalSystemLayout({
    system: frameProfile,
    layout: layoutData,
    label: `${safeLabel} - إطار وقواطع`,
    quantity: qtyMultiplier,
    scope: 'frame_only'
  })

  const compiledModules = modulesPreview.map((module) =>
    compileTechnicalSystemLayout({
      system: module.profile,
      layout: {
        wallWidthM: module.w,
        wallHeightM: module.h,
        mullionsH: [],
        mullionsW: [],
        fixed:
          module.type === 'fixed'
            ? [{ id: module.id, label: module.label, w: module.w, h: module.h }]
            : [],
        sashes:
          module.type === 'sash'
            ? [{ id: module.id, label: module.label, w: module.w, h: module.h }]
            : []
      },
      label: `${safeLabel} - ${module.label}`,
      quantity: qtyMultiplier,
      scope: 'leaf_only'
    })
  )

  return {
    pieces: [
      ...compiledFrame.pieces,
      ...compiledModules.flatMap((compiledModule) => compiledModule.pieces)
    ],
    glass: compiledModules.flatMap((compiledModule) => compiledModule.glass),
    accessories: compiledModules.flatMap((compiledModule) => compiledModule.accessories),
    operations: compiledModules.flatMap((compiledModule) => compiledModule.operations),
    errors: [
      ...compiledFrame.errors,
      ...compiledModules.flatMap((compiledModule) => compiledModule.errors)
    ],
    warnings,
    stats,
    modulesPreview,
    visualModel
  }
}
