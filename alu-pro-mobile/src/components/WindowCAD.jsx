// src/components/WindowCAD.jsx
import React, { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Line, Text, Group, Transformer } from 'react-konva'
import { v4 as uuidv4 } from 'uuid'

// مكتبة الأشكال الجاهزة
const SHAPE_LIBRARY = {
  window: {
    single: { name: 'شباك مفرد', width: 60, height: 100, type: 'casement' },
    double: { name: 'شباك مزدوج', width: 120, height: 100, type: 'double-casement' },
    sliding: { name: 'شباك جرار', width: 120, height: 100, type: 'sliding' },
    fixed: { name: 'شباك ثابت', width: 80, height: 80, type: 'fixed' },
    awning: { name: 'شباك علوي', width: 80, height: 60, type: 'awning' }
  },
  door: {
    single: { name: 'باب مفرد', width: 90, height: 210, type: 'single-door' },
    double: { name: 'باب مزدوج', width: 180, height: 210, type: 'double-door' },
    sliding: { name: 'باب جرار', width: 180, height: 210, type: 'sliding-door' }
  }
}

const WindowCAD = ({ onDesignChange, initialData = null }) => {
  const [shapes, setShapes] = useState(initialData?.shapes || [])
  const [selectedId, setSelectedId] = useState(null)
  const [tool, setTool] = useState('select') // select, rectangle, window, door, freehand
  const [isDrawing, setIsDrawing] = useState(false)
  const [newShape, setNewShape] = useState(null)

  const stageRef = useRef()
  const transformerRef = useRef()

  useEffect(() => {
    if (tool !== 'select' || !selectedId || !stageRef.current || !transformerRef.current) {
      return
    }

    const selectedNode = stageRef.current.findOne(
      (node) =>
        node.attrs.id === selectedId || (node.parent && node.parent.attrs.key === selectedId)
    )

    if (!selectedNode) {
      return
    }

    transformerRef.current.nodes([selectedNode.parent || selectedNode])
    transformerRef.current.getLayer()?.batchDraw()
  }, [selectedId, shapes, tool])

  const addPresetShape = (category, type) => {
    const preset = SHAPE_LIBRARY[category][type]
    const newItem = {
      id: uuidv4(),
      type: category,
      subType: type,
      x: 50,
      y: 50,
      width: preset.width * 3,
      height: preset.height * 3,
      rotation: 0,
      fill: category === 'window' ? '#E3F2FD' : '#FFF3E0',
      stroke: '#1976D2',
      strokeWidth: 2,
      sashType: preset.type,
      sections: [],
      measurements: { realWidth: preset.width, realHeight: preset.height, frameWidth: 5 }
    }
    const updatedShapes = [...shapes, newItem]
    setShapes(updatedShapes)
    notifyParent(updatedShapes)
  }

  const handleMouseDown = (e) => {
    if (tool === 'select') return
    const pos = e.target.getStage().getPointerPosition()
    setIsDrawing(true)
    if (tool === 'rectangle' || tool === 'freehand') {
      setNewShape({
        id: uuidv4(),
        type: tool,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        fill: tool === 'window' ? '#E3F2FD' : '#FFF3E0',
        stroke: '#1976D2',
        strokeWidth: 2
      })
    }
  }

  const handleMouseMove = (e) => {
    if (!isDrawing || !newShape) return
    const pos = e.target.getStage().getPointerPosition()
    setNewShape({ ...newShape, width: pos.x - newShape.x, height: pos.y - newShape.y })
  }

  const handleMouseUp = () => {
    if (!isDrawing || !newShape) return
    if (Math.abs(newShape.width) > 20 && Math.abs(newShape.height) > 20) {
      const finalShape = {
        ...newShape,
        width: Math.abs(newShape.width),
        height: Math.abs(newShape.height),
        x: newShape.width < 0 ? newShape.x + newShape.width : newShape.x,
        y: newShape.height < 0 ? newShape.y + newShape.height : newShape.y
      }
      const updatedShapes = [...shapes, finalShape]
      setShapes(updatedShapes)
      notifyParent(updatedShapes)
    }
    setIsDrawing(false)
    setNewShape(null)
    setTool('select')
  }

  const splitSection = (shapeId, direction) => {
    setShapes((prev) =>
      prev.map((shape) => {
        if (shape.id !== shapeId) return shape
        const sections = [...(shape.sections || [])]
        const newSection = {
          id: uuidv4(),
          direction,
          position: direction === 'vertical' ? shape.width / 2 : shape.height / 2,
          sashType: 'fixed'
        }
        return { ...shape, sections: [...sections, newSection] }
      })
    )
  }

  const updateShape = (id, newAttrs) => {
    const updated = shapes.map((s) => (s.id === id ? { ...s, ...newAttrs } : s))
    setShapes(updated)
    notifyParent(updated)
  }

  const deleteShape = (id) => {
    const updated = shapes.filter((s) => s.id !== id)
    setShapes(updated)
    setSelectedId(null)
    notifyParent(updated)
  }

  const notifyParent = (currentShapes) => {
    const designData = {
      shapes: currentShapes,
      summary: calculateSummary(currentShapes),
      exportData: generateExportData(currentShapes)
    }
    onDesignChange?.(designData)
  }

  const calculateSummary = (currentShapes) => ({
    totalWindows: currentShapes.filter((s) => s.type === 'window').length,
    totalDoors: currentShapes.filter((s) => s.type === 'door').length,
    totalArea: currentShapes.reduce((acc, s) => acc + s.width * s.height, 0) / 900
  })

  const generateExportData = (currentShapes) =>
    currentShapes.map((shape) => ({
      id: shape.id,
      type: shape.type,
      dimensions: {
        width: shape.measurements?.realWidth || Math.round(shape.width / 3),
        height: shape.measurements?.realHeight || Math.round(shape.height / 3)
      },
      frameProfile: 'standard_60mm',
      glassSpecs: 'double_glazed_6mm',
      accessories: ['handle', 'hinges', 'lock']
    }))

  const renderMeasurements = (shape) => {
    const offset = 10
    return (
      <Group key={`measure-${shape.id}`}>
        <Line
          points={[shape.x, shape.y - offset, shape.x + shape.width, shape.y - offset]}
          stroke="#666"
          strokeWidth={1}
          dash={[5, 5]}
        />
        <Text
          x={shape.x + shape.width / 2 - 20}
          y={shape.y - offset - 20}
          text={`${shape.measurements?.realWidth || Math.round(shape.width / 3)}cm`}
          fontSize={12}
          fill="#333"
        />
      </Group>
    )
  }

  return (
    <div
      className="window-cad-container"
      style={{ display: 'flex', height: '100%', minHeight: '600px' }}
      dir="rtl"
    >
      <div
        className="toolbar"
        style={{
          width: '250px',
          background: '#f8fafc',
          padding: '20px',
          borderLeft: '1px solid #e2e8f0',
          overflowY: 'auto'
        }}
      >
        <h3 className="font-black text-[#2B3674] mb-4 text-lg border-b pb-2">مكتبة الأشكال</h3>
        <div style={{ marginBottom: '20px' }}>
          <h4 className="font-bold text-gray-500 mb-2 text-sm">النوافذ</h4>
          {Object.entries(SHAPE_LIBRARY.window).map(([key, value]) => (
            <button
              key={key}
              onClick={() => addPresetShape('window', key)}
              className="w-full mb-2 p-2 bg-[#E3F2FD] border border-[#1976D2] rounded-lg cursor-pointer text-right font-bold text-xs hover:bg-[#bbdefb] transition-colors text-[#0d47a1]"
            >
              {value.name} ({value.width}x{value.height})
            </button>
          ))}
        </div>
        <div style={{ marginBottom: '20px' }}>
          <h4 className="font-bold text-gray-500 mb-2 text-sm">الأبواب</h4>
          {Object.entries(SHAPE_LIBRARY.door).map(([key, value]) => (
            <button
              key={key}
              onClick={() => addPresetShape('door', key)}
              className="w-full mb-2 p-2 bg-[#FFF3E0] border border-[#F57C00] rounded-lg cursor-pointer text-right font-bold text-xs hover:bg-[#ffe0b2] transition-colors text-[#e65100]"
            >
              {value.name} ({value.width}x{value.height})
            </button>
          ))}
        </div>
        <div style={{ marginBottom: '20px' }}>
          <h4 className="font-bold text-gray-500 mb-2 text-sm">أدوات الرسم</h4>
          <button
            onClick={() => setTool('rectangle')}
            className={`w-full p-2 mb-2 rounded-lg font-bold text-sm ${tool === 'rectangle' ? 'bg-[#2196F3] text-white' : 'bg-white border text-gray-700'}`}
          >
            ⬜ رسم حر
          </button>
          <button
            onClick={() => setTool('select')}
            className={`w-full p-2 rounded-lg font-bold text-sm ${tool === 'select' ? 'bg-[#2196F3] text-white' : 'bg-white border text-gray-700'}`}
          >
            🖱️ تحديد
          </button>
        </div>
        {selectedId && (
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <h4 className="font-black text-sm mb-3">خصائص الشكل</h4>
            <button
              onClick={() => splitSection(selectedId, 'vertical')}
              className="w-full mb-2 p-2 bg-gray-50 border rounded text-xs font-bold hover:bg-gray-100"
            >
              تقسيم عمودي
            </button>
            <button
              onClick={() => splitSection(selectedId, 'horizontal')}
              className="w-full mb-2 p-2 bg-gray-50 border rounded text-xs font-bold hover:bg-gray-100"
            >
              تقسيم أفقي
            </button>
            <button
              onClick={() => deleteShape(selectedId)}
              className="w-full p-2 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600"
            >
              🗑️ حذف الشكل
            </button>
          </div>
        )}
      </div>

      <div className="canvas-area" style={{ flex: 1, position: 'relative', background: '#f1f5f9' }}>
        <Stage
          width={800}
          height={600}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          ref={stageRef}
        >
          <Layer>
            {/* الشبكة الخلفية Grid */}
            {Array.from({ length: 40 }).map((_, i) => (
              <React.Fragment key={i}>
                <Line points={[i * 20, 0, i * 20, 1000]} stroke="#e2e8f0" strokeWidth={1} />
                <Line points={[0, i * 20, 1000, i * 20]} stroke="#e2e8f0" strokeWidth={1} />
              </React.Fragment>
            ))}

            {shapes.map((shape) => (
              <Group key={shape.id}>
                <Rect
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  fill={shape.fill}
                  stroke={selectedId === shape.id ? '#FF5722' : shape.stroke}
                  strokeWidth={selectedId === shape.id ? 3 : shape.strokeWidth}
                  draggable={tool === 'select'}
                  onClick={(e) => {
                    e.cancelBubble = true
                    setSelectedId(shape.id)
                  }}
                  onDragEnd={(e) => updateShape(shape.id, { x: e.target.x(), y: e.target.y() })}
                  onTransformEnd={(e) => {
                    const node = e.target
                    updateShape(shape.id, {
                      x: node.x(),
                      y: node.y(),
                      width: node.width() * node.scaleX(),
                      height: node.height() * node.scaleY(),
                      rotation: node.rotation()
                    })
                    node.scaleX(1)
                    node.scaleY(1)
                  }}
                />

                {shape.sections?.map((section, idx) => (
                  <Line
                    key={idx}
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
                    stroke="#333"
                    strokeWidth={2}
                  />
                ))}

                <Text
                  x={shape.x + 5}
                  y={shape.y + 5}
                  text={
                    shape.type === 'window' ? 'نافذة' : shape.type === 'door' ? 'باب' : 'شكل حر'
                  }
                  fontSize={12}
                  fontStyle="bold"
                  fill="#333"
                />
                {renderMeasurements(shape)}
              </Group>
            ))}

            {newShape && (
              <Rect
                x={newShape.x}
                y={newShape.y}
                width={newShape.width}
                height={newShape.height}
                fill="rgba(33, 150, 243, 0.2)"
                stroke="#2196F3"
                dash={[10, 5]}
              />
            )}

            {selectedId && (
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) =>
                  newBox.width < 20 || newBox.height < 20 ? oldBox : newBox
                }
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}

export default WindowCAD
