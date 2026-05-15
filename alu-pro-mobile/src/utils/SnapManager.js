export class SnapManager {
  constructor(gridSize = 10) {
    this.gridSize = gridSize
    this.guides = []
    this.snapThreshold = 5 // مسافة التقاط بالبكسل
  }

  // التقاط للشبكة
  snapToGrid(value) {
    if (this.gridSize < 1) {
      return Math.round(value * 2) / 2
    }
    return Math.round(value / this.gridSize) * this.gridSize
  }

  // التقاط للنقاط المحيطة (Object Snap)
  snapToObject(point, objects, excludeId = null) {
    let snapped = { x: point.x, y: point.y }
    let minDistance = Infinity
    let guides = []

    objects.forEach((obj) => {
      if (obj.id === excludeId) return

      // نقاط التقاط للكائن: الزوايا الأربع + المركز
      const snapPoints = this.getObjectSnapPoints(obj)

      snapPoints.forEach((snapPoint) => {
        const dist = this.getDistance(point, snapPoint)
        if (dist < this.snapThreshold && dist < minDistance) {
          minDistance = dist
          snapped = { x: snapPoint.x, y: snapPoint.y }
          guides.push({
            x: snapPoint.x,
            y: snapPoint.y,
            orientation: snapPoint.type
          })
        }
      })
    })

    return { point: snapped, guides }
  }

  getObjectSnapPoints(obj) {
    const points = []
    const halfW = obj.width / 2
    const halfH = obj.height / 2

    // الزوايا
    points.push(
      { x: obj.x, y: obj.y, type: 'corner-tl' },
      { x: obj.x + obj.width, y: obj.y, type: 'corner-tr' },
      { x: obj.x, y: obj.y + obj.height, type: 'corner-bl' },
      { x: obj.x + obj.width, y: obj.y + obj.height, type: 'corner-br' }
    )

    // المركز
    points.push({
      x: obj.x + halfW,
      y: obj.y + halfH,
      type: 'center'
    })

    // منتصف الحواف
    points.push(
      { x: obj.x + halfW, y: obj.y, type: 'edge-top' },
      { x: obj.x + halfW, y: obj.y + obj.height, type: 'edge-bottom' },
      { x: obj.x, y: obj.y + halfH, type: 'edge-left' },
      { x: obj.x + obj.width, y: obj.y + halfH, type: 'edge-right' }
    )

    return points
  }

  getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
  }

  // Snap شاملة تجمع Grid + Object
  snap(point, objects, excludeId = null, enableGrid = true, enableObject = true) {
    let result = { x: point.x, y: point.y }
    let activeGuides = []

    if (enableGrid) {
      result.x = this.snapToGrid(result.x)
      result.y = this.snapToGrid(result.y)
    }

    if (enableObject && objects.length > 0) {
      const objectSnap = this.snapToObject(point, objects, excludeId)
      if (objectSnap.guides.length > 0) {
        result = objectSnap.point
        activeGuides = objectSnap.guides
      }
    }

    return { point: result, guides: activeGuides }
  }
}
