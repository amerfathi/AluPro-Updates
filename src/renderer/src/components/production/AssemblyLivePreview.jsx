const formatMeasure = (value) => `${Number(value || 0).toFixed(3)} م`

const adaptPreviewModelToLegacyVisualModel = (previewModel) => {
  if (!previewModel) return null
  return {
    wallWidth: Number(previewModel.canvas?.widthM || 0),
    wallHeight: Number(previewModel.canvas?.heightM || 0),
    modules: (previewModel.modules || []).map((module) => ({
      id: module.id,
      type: module.type,
      label: module.label,
      x: Number(module.xM || 0),
      y: Number(module.yM || 0),
      w: Number(module.widthM || 0),
      h: Number(module.heightM || 0),
      profile: module.profile?.id
        ? {
            id: module.profile.id,
            name: module.profile.name,
            systemType: module.profile.systemType
          }
        : null
    })),
    mullions: {
      vertical: previewModel.mullions?.vertical || [],
      horizontal: previewModel.mullions?.horizontal || []
    },
    structuralPieces: previewModel.structuralPieces || [],
    coveragePercent: Number(previewModel.metrics?.coveragePercent || 0)
  }
}

const modulePalette = {
  fixed: {
    face: 'url(#fixedFace)',
    side: '#8ad4ea',
    stroke: '#0f8fb6',
    text: '#0f3f51',
    badge: 'ثابت'
  },
  sash: {
    face: 'url(#sashFace)',
    side: '#a9b6ff',
    stroke: '#5568ff',
    text: '#23318f',
    badge: 'متحرك'
  }
}

const DimensionLine = ({ x1, y1, x2, y2, label, vertical = false }) => {
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6b7aa6" strokeWidth="1.8" />
      <line
        x1={vertical ? x1 - 6 : x1}
        y1={vertical ? y1 : y1 - 6}
        x2={vertical ? x1 + 6 : x1}
        y2={vertical ? y1 : y1 + 6}
        stroke="#6b7aa6"
        strokeWidth="1.8"
      />
      <line
        x1={vertical ? x2 - 6 : x2}
        y1={vertical ? y2 : y2 - 6}
        x2={vertical ? x2 + 6 : x2}
        y2={vertical ? y2 : y2 + 6}
        stroke="#6b7aa6"
        strokeWidth="1.8"
      />
      <rect
        x={vertical ? midX - 24 : midX - 40}
        y={vertical ? midY - 15 : midY - 13}
        width={vertical ? 48 : 80}
        height="26"
        rx="13"
        fill="rgba(255,255,255,0.96)"
        stroke="rgba(140,156,200,0.45)"
      />
      <text
        x={midX}
        y={midY + 4}
        textAnchor="middle"
        fontSize="12"
        fontWeight="800"
        fill="#314069"
        direction="ltr"
      >
        {label}
      </text>
    </g>
  )
}

const AssemblyLivePreview = ({ visualModel, previewModel, frameProfileName = '' }) => {
  const computedVisualModel = previewModel
    ? adaptPreviewModelToLegacyVisualModel(previewModel)
    : visualModel || null

  if (!computedVisualModel) {
    return (
      <div className="rounded-[1.6rem] border border-[rgba(225,230,246,0.95)] bg-white p-5 shadow-sm">
        <div className="text-base font-black text-[var(--alu-text)]">المجسم الحي للتجميعة</div>
        <div className="mt-4 rounded-[1.4rem] border border-dashed border-[rgba(185,196,228,0.9)] bg-[#f8faff] px-5 py-10 text-center text-sm font-bold leading-7 text-[var(--alu-text-soft)]">
          ابدأ بإدخال المقاسات والصفوف والأعمدة والوحدات، وسيظهر هنا شكل النافذة أو الواجهة مع
          المقاسات والقواطع لحظة بلحظة.
        </div>
      </div>
    )
  }

  const frontWidth = 560
  const scale = frontWidth / Math.max(computedVisualModel.wallWidth || 1, 1)
  const frontHeight = Math.max(260, (computedVisualModel.wallHeight || 1) * scale)
  const depth = 26
  const outer = { x: 110, y: 88, w: frontWidth, h: frontHeight }
  const innerInset = 22
  const inner = {
    x: outer.x + innerInset,
    y: outer.y + innerInset,
    w: outer.w - innerInset * 2,
    h: outer.h - innerInset * 2
  }
  const viewBoxWidth = outer.x + outer.w + depth + 120
  const viewBoxHeight = outer.y + outer.h + 132

  const projectX = (value) =>
    inner.x + (value / Math.max(computedVisualModel.wallWidth || 1, 1)) * inner.w
  const projectY = (value) =>
    inner.y + (value / Math.max(computedVisualModel.wallHeight || 1, 1)) * inner.h

  const moduleRects = (computedVisualModel.modules || []).map((module) => {
    const px = projectX(module.x)
    const py = projectY(module.y)
    const pw = Math.max(
      1,
      (module.w / Math.max(computedVisualModel.wallWidth || 1, 1)) * inner.w
    )
    const ph = Math.max(
      1,
      (module.h / Math.max(computedVisualModel.wallHeight || 1, 1)) * inner.h
    )
    return {
      ...module,
      px,
      py,
      pw,
      ph
    }
  })

  const verticalMullions = (computedVisualModel.mullions?.vertical || []).map((segment) => ({
    ...segment,
    px: projectX(segment.x),
    py: projectY(segment.start),
    ph: Math.max(
      1,
      ((segment.end - segment.start) / Math.max(computedVisualModel.wallHeight || 1, 1)) * inner.h
    )
  }))

  const horizontalMullions = (computedVisualModel.mullions?.horizontal || []).map((segment) => ({
    ...segment,
    px: projectX(segment.start),
    py: projectY(segment.y),
    pw: Math.max(
      1,
      ((segment.end - segment.start) / Math.max(computedVisualModel.wallWidth || 1, 1)) * inner.w
    )
  }))

  const structuralPieces = computedVisualModel.structuralPieces || []

  return (
    <div className="rounded-[1.6rem] border border-[rgba(225,230,246,0.95)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-black text-[var(--alu-text)]">المجسم الحي للتجميعة</div>
          <p className="mt-2 text-sm font-bold leading-7 text-[var(--alu-text-soft)]">
            يتم تحديث الإطار والقواطع والوحدات والمقاسات فورًا مع كل تعديل. السماكات في الرسم
            تقريبية للمعاينة، أما الأبعاد المكتوبة على القطع فهي القيم الحقيقية.
          </p>
        </div>
        <div className="rounded-full bg-[#eef1ff] px-3 py-2 text-xs font-black text-[#5568ff]">
          {frameProfileName || 'بدون نظام إطار'}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-[rgba(225,230,246,0.95)] bg-[linear-gradient(135deg,#f8fbff_0%,#eef3ff_60%,#ffffff_100%)] p-3 shadow-inner">
        <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="h-auto w-full">
          <defs>
            <linearGradient id="frameFace" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#263456" />
              <stop offset="100%" stopColor="#3f527f" />
            </linearGradient>
            <linearGradient id="frameTop" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#63729e" />
              <stop offset="100%" stopColor="#8798c3" />
            </linearGradient>
            <linearGradient id="frameSide" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e2943" />
              <stop offset="100%" stopColor="#334467" />
            </linearGradient>
            <linearGradient id="fixedFace" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d7f6ff" />
              <stop offset="100%" stopColor="#effcff" />
            </linearGradient>
            <linearGradient id="sashFace" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e4e8ff" />
              <stop offset="100%" stopColor="#f5f7ff" />
            </linearGradient>
            <linearGradient id="mullionFace" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4f5f8c" />
              <stop offset="100%" stopColor="#7182af" />
            </linearGradient>
          </defs>

          <polygon
            points={`${outer.x},${outer.y} ${outer.x + outer.w},${outer.y} ${outer.x + outer.w + depth},${outer.y - depth} ${outer.x + depth},${outer.y - depth}`}
            fill="url(#frameTop)"
          />
          <polygon
            points={`${outer.x + outer.w},${outer.y} ${outer.x + outer.w + depth},${outer.y - depth} ${outer.x + outer.w + depth},${outer.y + outer.h - depth} ${outer.x + outer.w},${outer.y + outer.h}`}
            fill="url(#frameSide)"
          />
          <rect
            x={outer.x}
            y={outer.y}
            width={outer.w}
            height={outer.h}
            rx="30"
            fill="url(#frameFace)"
          />
          <rect
            x={inner.x}
            y={inner.y}
            width={inner.w}
            height={inner.h}
            rx="22"
            fill="#ffffff"
            stroke="rgba(135,152,195,0.55)"
            strokeWidth="2"
          />

          <rect
            x={inner.x + 8}
            y={inner.y + 8}
            width={inner.w - 16}
            height={inner.h - 16}
            rx="18"
            fill="rgba(236,242,255,0.9)"
          />

          {verticalMullions.map((segment) => (
            <g key={segment.id}>
              <polygon
                points={`${segment.px - 5},${segment.py} ${segment.px + 5},${segment.py} ${segment.px + 5 + depth * 0.35},${segment.py - depth * 0.35} ${segment.px - 5 + depth * 0.35},${segment.py - depth * 0.35}`}
                fill="#8a9ac4"
              />
              <rect
                x={segment.px - 5}
                y={segment.py}
                width="10"
                height={segment.ph}
                rx="4"
                fill="url(#mullionFace)"
              />
              {segment.ph > 70 && (
                <text
                  x={segment.px + 16}
                  y={segment.py + segment.ph / 2}
                  fontSize="11"
                  fontWeight="800"
                  fill="#314069"
                  direction="ltr"
                >
                  {formatMeasure(segment.length)}
                </text>
              )}
            </g>
          ))}

          {horizontalMullions.map((segment) => (
            <g key={segment.id}>
              <polygon
                points={`${segment.px},${segment.py - 5} ${segment.px + segment.pw},${segment.py - 5} ${segment.px + segment.pw + depth * 0.35},${segment.py - 5 - depth * 0.35} ${segment.px + depth * 0.35},${segment.py - 5 - depth * 0.35}`}
                fill="#8a9ac4"
              />
              <rect
                x={segment.px}
                y={segment.py - 5}
                width={segment.pw}
                height="10"
                rx="4"
                fill="url(#mullionFace)"
              />
              {segment.pw > 90 && (
                <text
                  x={segment.px + segment.pw / 2}
                  y={segment.py - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="800"
                  fill="#314069"
                  direction="ltr"
                >
                  {formatMeasure(segment.length)}
                </text>
              )}
            </g>
          ))}

          {moduleRects.map((module) => {
            const palette = modulePalette[module.type] || modulePalette.sash
            const labelSize = module.pw < 120 || module.ph < 95 ? 11 : 13
            return (
              <g key={module.id}>
                <polygon
                  points={`${module.px},${module.py} ${module.px + module.pw},${module.py} ${module.px + module.pw + depth * 0.3},${module.py - depth * 0.3} ${module.px + depth * 0.3},${module.py - depth * 0.3}`}
                  fill={palette.side}
                  opacity="0.72"
                />
                <polygon
                  points={`${module.px + module.pw},${module.py} ${module.px + module.pw + depth * 0.3},${module.py - depth * 0.3} ${module.px + module.pw + depth * 0.3},${module.py + module.ph - depth * 0.3} ${module.px + module.pw},${module.py + module.ph}`}
                  fill={palette.side}
                  opacity="0.84"
                />
                <rect
                  x={module.px}
                  y={module.py}
                  width={module.pw}
                  height={module.ph}
                  rx="16"
                  fill={palette.face}
                  stroke={module.profile ? palette.stroke : '#d64545'}
                  strokeWidth={module.profile ? 3 : 2.5}
                  strokeDasharray={module.profile ? '0' : '8 6'}
                />
                <rect
                  x={module.px + 12}
                  y={module.py + 12}
                  width={Math.max(module.pw - 24, 12)}
                  height={Math.max(module.ph - 24, 12)}
                  rx="12"
                  fill="rgba(255,255,255,0.65)"
                  stroke="rgba(255,255,255,0.9)"
                />
                <text
                  x={module.px + module.pw / 2}
                  y={module.py + 34}
                  textAnchor="middle"
                  fontSize={labelSize}
                  fontWeight="800"
                  fill={palette.text}
                >
                  {module.label}
                </text>
                <text
                  x={module.px + module.pw / 2}
                  y={module.py + 54}
                  textAnchor="middle"
                  fontSize={labelSize - 1}
                  fontWeight="700"
                  fill={palette.text}
                  direction="ltr"
                >
                  {formatMeasure(module.w)} × {formatMeasure(module.h)}
                </text>
                <text
                  x={module.px + module.pw / 2}
                  y={module.py + module.ph - 18}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill={module.profile ? palette.text : '#d64545'}
                >
                  {module.profile?.name || 'بدون نظام فني'}
                </text>
                <rect
                  x={module.px + 10}
                  y={module.py + module.ph - 34}
                  width="54"
                  height="18"
                  rx="9"
                  fill="rgba(255,255,255,0.88)"
                />
                <text
                  x={module.px + 37}
                  y={module.py + module.ph - 21}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  fill={palette.text}
                >
                  {palette.badge}
                </text>
              </g>
            )
          })}

          <DimensionLine
            x1={outer.x}
            y1={outer.y + outer.h + 36}
            x2={outer.x + outer.w}
            y2={outer.y + outer.h + 36}
            label={formatMeasure(computedVisualModel.wallWidth)}
          />
          <DimensionLine
            x1={outer.x - 34}
            y1={outer.y}
            x2={outer.x - 34}
            y2={outer.y + outer.h}
            label={formatMeasure(computedVisualModel.wallHeight)}
            vertical
          />
        </svg>
      </div>

      <div className="mt-5 rounded-[1.35rem] bg-[#f8faff] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-black text-[var(--alu-text)]">
            تفصيل القطع الظاهرة على الرسم
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#5568ff]">
            تغطية {Number(computedVisualModel.coveragePercent || 0).toFixed(1)}%
          </div>
        </div>
        <div className="alu-scrollbar mt-4 max-h-[18rem] space-y-3 overflow-y-auto pr-1">
          {structuralPieces.map((piece) => (
            <div
              key={piece.id}
              className="rounded-[1rem] border border-[rgba(225,230,246,0.95)] bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-[var(--alu-text)]">{piece.label}</div>
                  <div className="mt-1 text-xs font-bold text-[var(--alu-text-soft)]">
                    {piece.systemName || 'بدون نظام إطار'} ·{' '}
                    {piece.orientation === 'vertical' ? 'قطعة رأسية' : 'قطعة أفقية'}
                  </div>
                </div>
                <div
                  className="rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-black text-[#5568ff]"
                  dir="ltr"
                >
                  {formatMeasure(piece.length)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AssemblyLivePreview
