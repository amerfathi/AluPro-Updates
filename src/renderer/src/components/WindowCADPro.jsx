// src/components/WindowCADPro.jsx
import { useState, useRef, useEffect } from 'react'
import { Stage, Layer, Rect, Line, Text, Group, Transformer } from 'react-konva'
import { SnapManager } from '../utils/SnapManager'
import { v4 as uuidv4 } from 'uuid'

const PRO_SHAPES = {
  window: {
    casement: {
      name: 'شباك مفصلي',
      width: 80,
      height: 120,
      frameWidth: 6,
      sashType: 'casement',
      icon: '🪟'
    },
    sliding: {
      name: 'شباك سحاب',
      width: 160,
      height: 120,
      frameWidth: 6,
      sashType: 'sliding',
      sections: 2,
      icon: '🪟'
    },
    fixed: {
      name: 'شباك ثابت',
      width: 100,
      height: 100,
      frameWidth: 4,
      sashType: 'fixed',
      icon: '⬜'
    },
    awning: {
      name: 'شباك قلاب',
      width: 80,
      height: 60,
      frameWidth: 5,
      sashType: 'awning',
      icon: '🔼'
    }
  },
  door: {
    single: { name: 'باب مفرد', width: 90, height: 210, frameWidth: 8, icon: '🚪' },
    double: { name: 'باب مزدوج', width: 180, height: 210, frameWidth: 8, icon: '🚪🚪' },
    sliding: { name: 'باب سحاب', width: 180, height: 210, frameWidth: 8, icon: '↔️' }
  }
}

const WindowCADPro = ({ onDesignChange, scale = 3 }) => {
  const [shapes, setShapes] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [tool, setTool] = useState('select')
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState(null)
  const [currentRect, setCurrentRect] = useState(null)
  const [guides, setGuides] = useState([])

  // إعدادات الشاشة والزوم
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [gridEnabled, setGridEnabled] = useState(true)
  const [showDimensions, setShowDimensions] = useState(true)
  const [stageScale, setStageScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })

  const stageRef = useRef()
  const snapManager = useRef(new SnapManager(10))
  const transformerRef = useRef()

  // الحل السحري لمشكلة الشاشة البيضاء (تحديث صندوق التحديد بأمان)
  useEffect(() => {
    if (selectedId && tool === 'select' && transformerRef.current && stageRef.current) {
      const selectedNode = stageRef.current.findOne(`#shape-${selectedId}`)
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode])
        transformerRef.current.getLayer().batchDraw()
      }
    }
  }, [selectedId, shapes, tool])

  const pxToCm = (px) => Math.round((px / scale) * 10) / 10
  const cmToPx = (cm) => cm * scale

  const addProShape = (category, type) => {
    const template = PRO_SHAPES[category][type]
    const id = uuidv4()
    const newShape = {
      id,
      type: category,
      subType: type,
      x: 100 / stageScale - stagePos.x / stageScale,
      y: 100 / stageScale - stagePos.y / stageScale,
      width: cmToPx(template.width),
      height: cmToPx(template.height),
      rotation: 0,
      fill: category === 'window' ? '#E3F2FD' : '#FFF3E0',
      stroke: '#1976D2',
      strokeWidth: 2,
      frameWidth: template.frameWidth,
      sashType: template.sashType,
      realWidth: template.width,
      realHeight: template.height,
      sections: template.sections || 1,
      glass: 'double',
      handle: 'right',
      draggable: true
    }
    const updated = [...shapes, newShape]
    setShapes(updated)
    notifyParent(updated)
    setSelectedId(id)
  }

  const handleMouseDown = (e) => {
    if (tool !== 'rectangle') {
      if (e.target === stageRef.current.getStage()) setSelectedId(null)
      return
    }
    const pos = e.target.getStage().getPointerPosition()
    const logicalPos = {
      x: (pos.x - stagePos.x) / stageScale,
      y: (pos.y - stagePos.y) / stageScale
    }

    // إصلاح مشكلة التقاط الشبكة
    const snappedX = snapEnabled ? snapManager.current.snapToGrid(logicalPos.x) : logicalPos.x
    const snappedY = snapEnabled ? snapManager.current.snapToGrid(logicalPos.y) : logicalPos.y

    setIsDrawing(true)
    setDrawStart({ x: snappedX, y: snappedY })
    setCurrentRect({
      x: snappedX,
      y: snappedY,
      width: 0,
      height: 0,
      fill: 'rgba(33, 150, 243, 0.2)',
      stroke: '#2196F3',
      strokeWidth: 2,
      dash: [5, 5]
    })
  }

  const handleMouseMove = (e) => {
    if (!isDrawing || !drawStart) return
    const pos = e.target.getStage().getPointerPosition()
    const logicalPos = {
      x: (pos.x - stagePos.x) / stageScale,
      y: (pos.y - stagePos.y) / stageScale
    }

    let width = logicalPos.x - drawStart.x
    let height = logicalPos.y - drawStart.y

    if (snapEnabled) {
      const endX = snapManager.current.snapToGrid(logicalPos.x)
      const endY = snapManager.current.snapToGrid(logicalPos.y)
      width = endX - drawStart.x
      height = endY - drawStart.y
    }

    setCurrentRect((prev) => ({
      ...prev,
      width: Math.abs(width),
      height: Math.abs(height),
      x: width < 0 ? drawStart.x + width : drawStart.x,
      y: height < 0 ? drawStart.y + height : drawStart.y
    }))
  }

  const handleMouseUp = () => {
    if (!isDrawing || !currentRect) return
    if (currentRect.width > 20 && currentRect.height > 20) {
      const newShape = {
        ...currentRect,
        id: uuidv4(),
        type: 'window',
        subType: 'custom',
        rotation: 0,
        fill: '#E3F2FD',
        stroke: '#1976D2',
        realWidth: pxToCm(currentRect.width),
        realHeight: pxToCm(currentRect.height),
        frameWidth: 6,
        sashType: 'fixed',
        sections: 1,
        draggable: true,
        dash: []
      }
      const updated = [...shapes, newShape]
      setShapes(updated)
      notifyParent(updated)
      setSelectedId(newShape.id)
    }
    setIsDrawing(false)
    setDrawStart(null)
    setCurrentRect(null)
    setTool('select')
  }

  const handleWheel = (e) => {
    e.evt.preventDefault()
    const scaleBy = 1.1
    const stage = e.target.getStage()
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale
    }
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy

    setStageScale(newScale)
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale
    })
  }

  const handleDragMove = (e, shape) => {
    if (!snapEnabled) return
    const pos = { x: e.target.x(), y: e.target.y() }
    const snapResult = snapManager.current.snap(pos, shapes, shape.id, gridEnabled, true)
    e.target.position({ x: snapResult.point.x, y: snapResult.point.y })
    setGuides(snapResult.guides)
  }

  const handleDragEnd = (e, shape) => {
    updateShape(shape.id, { x: e.target.x(), y: e.target.y() })
    setGuides([])
  }

  const updateShape = (id, newAttrs) => {
    const updated = shapes.map((s) => {
      if (s.id !== id) return s
      const newShape = { ...s, ...newAttrs }
      if (newAttrs.width || newAttrs.height) {
        newShape.realWidth = pxToCm(newShape.width)
        newShape.realHeight = pxToCm(newShape.height)
      }
      return newShape
    })
    setShapes(updated)
    notifyParent(updated)
  }

  const deleteShape = (id) => {
    const updated = shapes.filter((s) => s.id !== id)
    setShapes(updated)
    setSelectedId(null)
    notifyParent(updated)
  }

  const notifyParent = (data) => {
    onDesignChange?.({
      shapes: data,
      summary: {
        count: data.length,
        totalArea: data.reduce((acc, s) => acc + s.realWidth * s.realHeight, 0) / 10000
      }
    })
  }

  const splitWindow = (direction) => {
    if (!selectedId) return
    const shape = shapes.find((s) => s.id === selectedId)
    if (!shape) return
    const newSection = {
      id: uuidv4(),
      direction,
      position: direction === 'vertical' ? shape.width / 2 : shape.height / 2,
      sashType: 'fixed'
    }
    updateShape(selectedId, { sections: [...(shape.sections || []), newSection] })
  }

  const renderGrid = () => {
    const gridLines = []
    const stageWidth = 2000
    const stageHeight = 2000
    for (let i = 0; i < stageWidth; i += 20) {
      gridLines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, stageHeight]}
          stroke="#E0E0E0"
          strokeWidth={1}
          opacity={0.5}
        />
      )
    }
    for (let i = 0; i < stageHeight; i += 20) {
      gridLines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, stageWidth, i]}
          stroke="#E0E0E0"
          strokeWidth={1}
          opacity={0.5}
        />
      )
    }
    return gridLines
  }

  const renderDimensions = (shape) => {
    if (!showDimensions) return null
    const offset = 15
    return (
      <Group key={`dim-${shape.id}`}>
        <Line
          points={[shape.x, shape.y - offset, shape.x + shape.width, shape.y - offset]}
          stroke="#666"
          strokeWidth={1}
        />
        <Line
          points={[shape.x, shape.y - offset - 3, shape.x, shape.y - offset + 3]}
          stroke="#666"
          strokeWidth={1}
        />
        <Line
          points={[
            shape.x + shape.width,
            shape.y - offset - 3,
            shape.x + shape.width,
            shape.y - offset + 3
          ]}
          stroke="#666"
          strokeWidth={1}
        />
        <Text
          x={shape.x + shape.width / 2 - 15}
          y={shape.y - offset - 20}
          text={`${shape.realWidth}cm`}
          fontSize={11}
          fill="#333"
          fontStyle="bold"
        />

        <Line
          points={[
            shape.x + shape.width + offset,
            shape.y,
            shape.x + shape.width + offset,
            shape.y + shape.height
          ]}
          stroke="#666"
          strokeWidth={1}
        />
        <Line
          points={[
            shape.x + shape.width + offset - 3,
            shape.y,
            shape.x + shape.width + offset + 3,
            shape.y
          ]}
          stroke="#666"
          strokeWidth={1}
        />
        <Line
          points={[
            shape.x + shape.width + offset - 3,
            shape.y + shape.height,
            shape.x + shape.width + offset + 3,
            shape.y + shape.height
          ]}
          stroke="#666"
          strokeWidth={1}
        />
        <Text
          x={shape.x + shape.width + offset + 5}
          y={shape.y + shape.height / 2 - 10}
          text={`${shape.realHeight}cm`}
          fontSize={11}
          fill="#333"
          fontStyle="bold"
          rotation={90}
        />
      </Group>
    )
  }

  const renderSections = (shape) => {
    if (!shape.sections) return null
    return shape.sections.map((section, idx) => (
      <Line
        key={`sec-${shape.id}-${idx}`}
        points={
          section.direction === 'vertical'
            ? [
                shape.x + section.position,
                shape.y,
                shape.x + section.position,
                shape.y + shape.height
              ]
            : [
                shape.x,
                shape.y + section.position,
                shape.x + shape.width,
                shape.y + section.position
              ]
        }
        stroke="#424242"
        strokeWidth={3}
        lineCap="round"
      />
    ))
  }

  return (
    <div
      style={{ display: 'flex', height: '100%', fontFamily: 'Segoe UI, Tahoma, sans-serif' }}
      dir="rtl"
    >
      {/* شريط الأدوات */}
      <div
        style={{
          width: '280px',
          background: '#FAFAFA',
          borderLeft: '1px solid #E0E0E0',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10
        }}
      >
        <div style={{ padding: '15px', borderBottom: '1px solid #E0E0E0', background: '#FFF' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#1976D2', fontWeight: 'bold' }}>
            🎨 مصمم الواجهات (Pro)
          </h2>
          <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>
            عجلة الماوس للزوم (Zoom)
          </p>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '15px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => setTool('select')}
                style={{
                  padding: '10px',
                  background: tool === 'select' ? '#1976D2' : '#FFF',
                  color: tool === 'select' ? '#FFF' : '#333',
                  border: '1px solid #DDD',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                🖱️ تحديد
              </button>
              <button
                onClick={() => setTool('rectangle')}
                style={{
                  padding: '10px',
                  background: tool === 'rectangle' ? '#1976D2' : '#FFF',
                  color: tool === 'rectangle' ? '#FFF' : '#333',
                  border: '1px solid #DDD',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                ⬜ رسم حر
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4
              style={{ fontSize: '13px', color: '#333', marginBottom: '10px', fontWeight: 'bold' }}
            >
              🪟 النوافذ الجاهزة
            </h4>
            {Object.entries(PRO_SHAPES.window).map(([key, value]) => (
              <button
                key={key}
                onClick={() => addProShape('window', key)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '8px',
                  background: '#E3F2FD',
                  border: '1px solid #1976D2',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'right',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span style={{ fontSize: '18px' }}>{value.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0d47a1' }}>
                    {value.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#1976D2' }}>
                    {value.width}×{value.height} سم
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedId && (
            <div
              style={{
                background: '#FFF',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #E0E0E0',
                marginBottom: '20px'
              }}
            >
              <h4
                style={{
                  fontSize: '13px',
                  color: '#333',
                  marginBottom: '10px',
                  fontWeight: 'bold'
                }}
              >
                ⚙️ خصائص وقواطع
              </h4>
              <button
                onClick={() => splitWindow('vertical')}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '8px',
                  background: '#F5F5F5',
                  border: '1px solid #DDD',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                ⬌ قاطع عمودي
              </button>
              <button
                onClick={() => splitWindow('horizontal')}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '8px',
                  background: '#F5F5F5',
                  border: '1px solid #DDD',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                ⬍ قاطع أفقي
              </button>
              <button
                onClick={() => deleteShape(selectedId)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#FFEBEE',
                  border: '1px solid #EF5350',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#C62828',
                  fontWeight: 'bold'
                }}
              >
                🗑️ حذف الشكل
              </button>
            </div>
          )}

          <div
            style={{
              background: '#FFF',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #E0E0E0'
            }}
          >
            <h4
              style={{ fontSize: '13px', color: '#333', marginBottom: '10px', fontWeight: 'bold' }}
            >
              🧲 خيارات العرض
            </h4>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              <input
                type="checkbox"
                checked={snapEnabled}
                onChange={(e) => setSnapEnabled(e.target.checked)}
                style={{ marginLeft: '8px' }}
              />{' '}
              تفعيل Snap (المغناطيس)
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              <input
                type="checkbox"
                checked={gridEnabled}
                onChange={(e) => setGridEnabled(e.target.checked)}
                style={{ marginLeft: '8px' }}
              />{' '}
              عرض الشبكة (Grid)
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              <input
                type="checkbox"
                checked={showDimensions}
                onChange={(e) => setShowDimensions(e.target.checked)}
                style={{ marginLeft: '8px' }}
              />{' '}
              عرض المقاسات
            </label>
          </div>
        </div>
      </div>

      {/* منطقة الرسم */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#e2e8f0' }}>
        <Stage
          width={window.innerWidth}
          height={window.innerHeight}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePos.x}
          y={stagePos.y}
          ref={stageRef}
        >
          <Layer>
            {gridEnabled && renderGrid()}

            {guides.map((guide, idx) => (
              <Line
                key={`guide-${idx}`}
                points={
                  guide.orientation.includes('edge-left') ||
                  guide.orientation.includes('edge-right')
                    ? [guide.x, -1000, guide.x, 1000]
                    : [-1000, guide.y, 1000, guide.y]
                }
                stroke="#FF5722"
                strokeWidth={1}
                dash={[4, 4]}
                opacity={0.8}
              />
            ))}

            {shapes.map((shape) => (
              <Group key={shape.id} id={`shape-${shape.id}`}>
                <Rect
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  fill={shape.fill}
                  stroke={selectedId === shape.id ? '#FF5722' : shape.stroke}
                  strokeWidth={
                    selectedId === shape.id ? 3 / stageScale : shape.strokeWidth / stageScale
                  }
                  draggable={tool === 'select'}
                  onClick={(e) => {
                    e.cancelBubble = true
                    setSelectedId(shape.id)
                  }}
                  onDragMove={(e) => handleDragMove(e, shape)}
                  onDragEnd={(e) => handleDragEnd(e, shape)}
                  onTransformEnd={(e) => {
                    const node = e.target
                    updateShape(shape.id, {
                      x: node.x(),
                      y: node.y(),
                      width: Math.max(20, node.width() * node.scaleX()),
                      height: Math.max(20, node.height() * node.scaleY()),
                      rotation: node.rotation()
                    })
                    node.scaleX(1)
                    node.scaleY(1)
                  }}
                />
                {renderSections(shape)}
                <Text
                  x={shape.x + 5}
                  y={shape.y + 5}
                  text={shape.type === 'window' ? '🪟' : '🚪'}
                  fontSize={16 / stageScale}
                />
                {renderDimensions(shape)}
              </Group>
            ))}

            {currentRect && (
              <Rect
                x={currentRect.x}
                y={currentRect.y}
                width={currentRect.width}
                height={currentRect.height}
                fill={currentRect.fill}
                stroke={currentRect.stroke}
                strokeWidth={currentRect.strokeWidth / stageScale}
                dash={currentRect.dash}
              />
            )}

            {selectedId && tool === 'select' && (
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) =>
                  newBox.width < 30 || newBox.height < 30 ? oldBox : newBox
                }
                anchorSize={8 / stageScale}
                anchorStroke="#FF5722"
                anchorFill="#FFF"
                borderStroke="#FF5722"
                borderDash={[5, 5]}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}

export default WindowCADPro
