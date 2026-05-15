import { parseArabicNum } from './number.js'

export const getExtrusionType = (label) => {
  if (!label) return 'أخرى'

  const parts = String(label).split(' - ')
  const baseLabel = parts.length > 1 ? parts[1].trim() : String(label).trim()

  return baseLabel.split(' (')[0].trim()
}

export const optimizeCutting = (neededPieces, stockLength, bladeThicknessMm, miterWasteCm) => {
  const bladeThicknessM = bladeThicknessMm / 1000
  const sortedPieces = [...neededPieces].sort((a, b) => b.length - a.length)
  const bars = []

  sortedPieces.forEach((piece) => {
    for (let index = 0; index < piece.quantity; index += 1) {
      let placed = false
      const pieceMiterWasteM =
        (parseFloat(parseArabicNum(piece.miterWasteCm)) || miterWasteCm) / 100
      const currentMiterWaste = piece.cutType === '45' ? pieceMiterWasteM : 0
      const actualSpaceNeeded = piece.length + currentMiterWaste + bladeThicknessM

      for (const bar of bars) {
        if (bar.remaining >= actualSpaceNeeded) {
          bar.cuts.push({
            length: piece.length,
            label: piece.label,
            cutType: piece.cutType,
            technicalWaste: currentMiterWaste
          })
          bar.remaining -= actualSpaceNeeded
          placed = true
          break
        }
      }

      if (!placed) {
        bars.push({
          totalLength: stockLength,
          remaining: stockLength - actualSpaceNeeded,
          cuts: [
            {
              length: piece.length,
              label: piece.label,
              cutType: piece.cutType,
              technicalWaste: currentMiterWaste
            }
          ]
        })
      }
    }
  })

  return bars
}

export const groupIdenticalBars = (bars) => {
  const groups = {}

  bars.forEach((bar) => {
    const patternKey = bar.cuts
      .map(
        (cut) =>
          `${Number(cut.length).toFixed(3)}-${cut.cutType}-${Number(cut.technicalWaste).toFixed(3)}-${cut.label}`
      )
      .sort()
      .join('|')

    if (!groups[patternKey]) {
      groups[patternKey] = { ...bar, patternCount: 1 }
    } else {
      groups[patternKey].patternCount += 1
    }
  })

  return Object.values(groups).sort((a, b) => b.patternCount - a.patternCount)
}

export const calculatePieceLength = (width, height, pieceDefinition) => {
  if (!width || !height) return 0

  const baseValue = pieceDefinition.baseDim === 'W' ? width : height
  const dividedValue = baseValue / (parseInt(pieceDefinition.divideBy) || 1)
  const offsetMeters = (parseFloat(parseArabicNum(pieceDefinition.offsetCm)) || 0) / 100
  const finalLength = dividedValue + offsetMeters

  return finalLength <= 0 ? 0 : Number(finalLength.toFixed(3))
}

export const calculateGlassDimensions = (width, height, glassDefinition) => {
  if (!width || !height) return { w: 0, h: 0 }

  const divideWidth = parseInt(glassDefinition.divideW) || 1
  const offsetWidth = (parseFloat(parseArabicNum(glassDefinition.offsetW)) || 0) / 100
  const divideHeight = parseInt(glassDefinition.divideH) || 1
  const offsetHeight = (parseFloat(parseArabicNum(glassDefinition.offsetH)) || 0) / 100

  const finalWidth = width / divideWidth + offsetWidth
  const finalHeight = height / divideHeight + offsetHeight

  return {
    w: finalWidth <= 0 ? 0 : Number(finalWidth.toFixed(3)),
    h: finalHeight <= 0 ? 0 : Number(finalHeight.toFixed(3))
  }
}
