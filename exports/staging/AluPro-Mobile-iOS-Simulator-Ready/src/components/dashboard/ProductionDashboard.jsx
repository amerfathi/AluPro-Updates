import {
  Archive,
  ArrowUpRight,
  Boxes,
  Building2,
  FolderOpen,
  PackageOpen,
  Scissors,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet
} from 'lucide-react'

const formatCurrency = (value) => `${Number(value || 0).toLocaleString()} ر.س`

const chartLabels = ['تسعير', 'اعتماد', 'قص', 'زجاج', 'إكسسوارات', 'تسليم']

const buildAreaPath = (points, baseline) => {
  if (!points.length) return ''

  const first = points[0]
  const last = points[points.length - 1]
  const curve = points.map((point) => `L ${point.x} ${point.y}`).join(' ')

  return `M ${first.x} ${baseline} ${curve} L ${last.x} ${baseline} Z`
}

const getProjectStatus = (project) => {
  const contractValue = Number(project.contractValue) || 0
  const profit = Number(project.profit) || 0

  if (!contractValue) {
    return {
      label: 'مسودة',
      className: 'bg-[#fff7e7] text-[#c69024]'
    }
  }

  if (profit > 0) {
    return {
      label: 'نشط',
      className: 'bg-[#eef1ff] text-[#5568ff]'
    }
  }

  return {
    label: 'مراجعة',
    className: 'bg-[#fff1f6] text-[#ff7e9f]'
  }
}

const ProductionDashboard = ({
  companyName,
  savedProjects,
  dashboardStats,
  neededPieces,
  neededGlass,
  neededAccessories,
  financialSummary,
  onOpenArchive,
  onOpenInventory,
  onOpenProject,
  onOpenProduction
}) => {
  const queuePieces = neededPieces.reduce((sum, piece) => sum + (Number(piece.quantity) || 0), 0)
  const queueGlass = neededGlass.reduce((sum, glass) => sum + (Number(glass.quantity) || 0), 0)
  const queueAccessories = neededAccessories.reduce(
    (sum, accessory) => sum + (Number(accessory.quantity) || 0),
    0
  )

  const totalQueue = queuePieces + queueGlass + queueAccessories
  const recentProjects = [...savedProjects].slice(-5).reverse()

  const mixSegments =
    totalQueue > 0
      ? [
          { label: 'ألمنيوم', value: queuePieces, color: '#5568ff' },
          { label: 'زجاج', value: queueGlass, color: '#60d1c3' },
          { label: 'إكسسوارات', value: queueAccessories, color: '#ff8dad' }
        ].filter((segment) => segment.value > 0)
      : [{ label: 'مساحة العمل', value: 1, color: '#d9deef' }]

  const ringRadius = 68
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringTotal = Math.max(
    mixSegments.reduce((sum, segment) => sum + segment.value, 0),
    1
  )

  let ringOffset = 0
  const ringStrokes = mixSegments.map((segment) => {
    const length = (segment.value / ringTotal) * ringCircumference
    const stroke = {
      ...segment,
      strokeDasharray: `${length} ${ringCircumference - length}`,
      strokeDashoffset: -ringOffset
    }

    ringOffset += length
    return stroke
  })

  const workflowRaw = [
    Math.max(savedProjects.length, 1),
    Math.max(Math.round(queuePieces / 4), 1),
    Math.max(Math.round(queueGlass / 2), 1),
    Math.max(queueAccessories, 1),
    Math.max(Math.round(dashboardStats.leftoversLength), 1),
    Math.max(Math.round((financialSummary.expectedProfit || 0) / 1000), 1)
  ]

  const chartWidth = 520
  const chartHeight = 220
  const padX = 28
  const padY = 26
  const maxValue = Math.max(...workflowRaw, 1)

  const chartPoints = workflowRaw.map((value, index) => {
    const x = padX + (index * (chartWidth - padX * 2)) / (workflowRaw.length - 1)
    const y =
      chartHeight -
      padY -
      ((value / maxValue) * (chartHeight - padY * 2) * 0.9 + (chartHeight - padY * 2) * 0.05)

    return { x, y }
  })

  const chartPolyline = chartPoints.map((point) => `${point.x},${point.y}`).join(' ')
  const chartAreaPath = buildAreaPath(chartPoints, chartHeight - padY)

  const summaryCards = [
    {
      label: 'قيمة العقود',
      value: formatCurrency(dashboardStats.totalContracts),
      icon: Wallet,
      tone: 'bg-[#eef1ff] text-[#5568ff]'
    },
    {
      label: 'ربحية الملف المفتوح',
      value: formatCurrency(financialSummary.expectedProfit),
      icon: TrendingUp,
      tone: 'bg-[#ebfbf8] text-[#2bb5a7]'
    },
    {
      label: 'بواقي صالحة',
      value: `${dashboardStats.leftoversLength.toLocaleString(undefined, {
        maximumFractionDigits: 1
      })} م`,
      icon: Archive,
      tone: 'bg-[#fff1f6] text-[#ff7e9f]'
    }
  ]

  const miniStats = [
    {
      label: 'أوامر محفوظة',
      value: savedProjects.length.toLocaleString(),
      helper: 'ضمن الأرشيف',
      icon: FolderOpen,
      tone: 'bg-[#eef1ff] text-[#5568ff]'
    },
    {
      label: 'احتياج خامات',
      value: formatCurrency(dashboardStats.totalMaterialCosts),
      helper: 'تكلفة تقديرية',
      icon: PackageOpen,
      tone: 'bg-[#eef8ff] text-[#4c85ff]'
    },
    {
      label: 'رصيد جاهز',
      value: `${queuePieces.toLocaleString()} قطعة`,
      helper: 'لقائمة القص',
      icon: Scissors,
      tone: 'bg-[#ebfbf8] text-[#2bb5a7]'
    }
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-2">
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.45fr]">
        <div className="alu-panel rounded-[1.9rem] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eef1ff] px-3 py-1.5 text-[11px] font-black text-[#5568ff]">
                <Sparkles size={14} />
                نظرة تشغيلية سريعة
              </div>
              <h3 className="mt-4 text-xl font-black text-[var(--alu-text)]">توزيع أوامر الورشة</h3>
              <p className="mt-1 text-sm font-bold text-[var(--alu-text-soft)]">
                قراءة مباشرة لحالة الملف المفتوح بين الألمنيوم والزجاج والإكسسوارات.
              </p>
            </div>

            <div className="rounded-full bg-[#ebfbf8] px-3 py-1.5 text-xs font-black text-[#2bb5a7]">
              {companyName || 'المصنع'}
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-6 lg:flex-row lg:items-start">
            <div className="relative h-[220px] w-[220px] shrink-0">
              <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90">
                <circle
                  cx="110"
                  cy="110"
                  r={ringRadius}
                  fill="none"
                  stroke="#edf1fb"
                  strokeWidth="18"
                />

                {ringStrokes.map((segment) => (
                  <circle
                    key={segment.label}
                    cx="110"
                    cy="110"
                    r={ringRadius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="18"
                    strokeLinecap="round"
                    strokeDasharray={segment.strokeDasharray}
                    strokeDashoffset={segment.strokeDashoffset}
                  />
                ))}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-black tracking-tight text-[var(--alu-text)]">
                  {totalQueue.toLocaleString()}
                </div>
                <div className="mt-1 text-xs font-black text-[var(--alu-text-soft)]">
                  عنصر إنتاج
                </div>
                <div className="mt-3 rounded-full bg-[#f5f7fd] px-3 py-1 text-[11px] font-black text-[#7f88a4]">
                  داخل مساحة العمل
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              {ringStrokes.map((segment) => (
                <div
                  key={segment.label}
                  className="flex items-center justify-between rounded-[1.2rem] bg-[#f7f9fd] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3.5 w-3.5 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-sm font-black text-[var(--alu-text)]">
                      {segment.label}
                    </span>
                  </div>

                  <span className="text-sm font-black text-[var(--alu-text-soft)]">
                    {segment.value.toLocaleString()}
                  </span>
                </div>
              ))}

              <div className="grid gap-3 pt-2 md:grid-cols-3">
                {summaryCards.map((card) => {
                  const Icon = card.icon

                  return (
                    <div
                      key={card.label}
                      className="rounded-[1.25rem] border border-[rgba(231,235,247,0.92)] bg-white px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className={`rounded-[0.9rem] p-2 ${card.tone}`}>
                          <Icon size={16} />
                        </div>
                        <ArrowUpRight size={16} className="text-[#c7cee3]" />
                      </div>

                      <div className="mt-4 text-[12px] font-black text-[var(--alu-text-soft)]">
                        {card.label}
                      </div>
                      <div className="mt-2 text-lg font-black text-[var(--alu-text)]">
                        {card.value}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="alu-panel rounded-[1.9rem] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f3f5ff] px-3 py-1.5 text-[11px] font-black text-[#7d6bff]">
                <TrendingUp size={14} />
                تحليلات سير العمل
              </div>
              <h3 className="mt-4 text-xl font-black text-[var(--alu-text)]">
                مسار التحويل من التسعير إلى التسليم
              </h3>
              <p className="mt-1 text-sm font-bold text-[var(--alu-text-soft)]">
                قراءة مبسطة توضّح أين تتركز الحركة داخل الملف الجاري والمشاريع المحفوظة.
              </p>
            </div>

            <div className="rounded-full bg-[#eef1ff] px-3 py-1.5 text-xs font-black text-[#5568ff]">
              تحديث لحظي
            </div>
          </div>

          <div className="mt-6 rounded-[1.7rem] bg-[#f8faff] p-5">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[230px] w-full">
              {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
                <line
                  key={ratio}
                  x1={0}
                  x2={chartWidth}
                  y1={chartHeight - padY - ratio * (chartHeight - padY * 2)}
                  y2={chartHeight - padY - ratio * (chartHeight - padY * 2)}
                  stroke="#e9edf8"
                  strokeDasharray="4 6"
                />
              ))}

              <path d={chartAreaPath} fill="url(#workflowFill)" opacity="0.95" />

              <defs>
                <linearGradient id="workflowFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#5568ff" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#5568ff" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              <polyline
                fill="none"
                stroke="#5568ff"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={chartPolyline}
              />

              {chartPoints.map((point, index) => (
                <g key={`${point.x}-${point.y}`}>
                  <circle cx={point.x} cy={point.y} r="8" fill="#ffffff" stroke="#5568ff" />
                  <circle cx={point.x} cy={point.y} r="3" fill="#5568ff" />
                  {index === 2 && (
                    <g>
                      <rect
                        x={point.x - 44}
                        y={point.y - 46}
                        rx="10"
                        width="88"
                        height="28"
                        fill="#171f33"
                      />
                      <text
                        x={point.x}
                        y={point.y - 28}
                        fill="#ffffff"
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="700"
                      >
                        {formatCurrency(dashboardStats.totalMaterialCosts)}
                      </text>
                    </g>
                  )}
                </g>
              ))}
            </svg>

            <div className="mt-4 grid grid-cols-6 gap-2 text-center">
              {chartLabels.map((label) => (
                <div key={label} className="text-[11px] font-black text-[var(--alu-text-soft)]">
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="alu-panel rounded-[1.9rem] p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-[var(--alu-text)]">آخر المشاريع المحفوظة</h3>
              <div className="mt-1 text-sm font-bold text-[var(--alu-text-soft)]">
                نفس منطق جدول النموذج، لكن بمشاريع الألمنيوم الجاهزة للرجوع والتشغيل.
              </div>
            </div>

            <button
              onClick={onOpenArchive}
              className="rounded-[1rem] bg-[#f5f7fd] px-4 py-2 text-xs font-black text-[#5568ff] transition-all hover:bg-[#eef1ff]"
            >
              فتح الأرشيف
            </button>
          </div>

          {recentProjects.length === 0 ? (
            <div className="rounded-[1.7rem] border border-dashed border-[#e3e7f4] bg-[#fbfcff] px-6 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.2rem] bg-[#eef1ff] text-[#5568ff]">
                <Building2 size={28} />
              </div>
              <div className="mt-4 text-lg font-black text-[var(--alu-text)]">
                لا توجد ملفات تشغيل محفوظة بعد
              </div>
              <div className="mt-2 text-sm font-bold text-[var(--alu-text-soft)]">
                أضف أول مشروع وسيظهر هنا بنفس ترتيب لوحة المبيعات التي أعجبتك لكن بصيغة المصنع.
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[1.7rem] border border-[rgba(231,235,247,0.96)]">
              <div className="grid grid-cols-[0.7fr_1.4fr_1.3fr_1fr_0.9fr_1fr] gap-3 bg-[#fafbff] px-5 py-4 text-[11px] font-black text-[var(--alu-text-soft)]">
                <div>#</div>
                <div>العميل</div>
                <div>البند الرئيسي</div>
                <div>التاريخ</div>
                <div>الحالة</div>
                <div className="text-left">القيمة</div>
              </div>

              {recentProjects.map((project, index) => {
                const status = getProjectStatus(project)
                const projectTitle =
                  project.contractItems?.find((item) => item.name)?.name || 'أمر ألمنيوم عام'

                return (
                  <div
                    key={project.id || index}
                    className="grid grid-cols-[0.7fr_1.4fr_1.3fr_1fr_0.9fr_1fr] gap-3 border-t border-[rgba(238,241,249,0.95)] bg-white px-5 py-4 text-sm font-bold text-[var(--alu-text)]"
                  >
                    <div className="text-[var(--alu-text-soft)]">{index + 1}</div>
                    <div className="truncate">{project.info?.clientName || 'بدون اسم عميل'}</div>
                    <div className="truncate text-[var(--alu-text-soft)]">{projectTitle}</div>
                    <div className="text-[var(--alu-text-soft)]">
                      {project.info?.date || 'بدون تاريخ'}
                    </div>
                    <div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-black ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div className="text-left font-black">
                      {formatCurrency(project.contractValue)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="alu-panel rounded-[1.9rem] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-[1rem] bg-[#eef1ff] p-2.5 text-[#5568ff]">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="text-lg font-black text-[var(--alu-text)]">اختصارات التشغيل</div>
                <div className="text-xs font-bold text-[var(--alu-text-soft)]">
                  نفس ترتيب الأزرار السريعة في التصميم المرجعي لكن مرتبطة بخطوات المصنع.
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                onClick={onOpenProject}
                className="flex items-center justify-between rounded-[1.25rem] border border-[#e7ebf7] bg-white px-4 py-4 text-right font-black text-[#5568ff] transition-all hover:bg-[#f8f9ff]"
              >
                <span>فتح ملف المشروع</span>
                <Building2 size={18} />
              </button>

              <button
                onClick={onOpenProduction}
                className="flex items-center justify-between rounded-[1.25rem] border border-[#e7ebf7] bg-white px-4 py-4 text-right font-black text-[#2bb5a7] transition-all hover:bg-[#f5fdfb]"
              >
                <span>متابعة الإنتاج والقص</span>
                <Scissors size={18} />
              </button>

              <button
                onClick={onOpenInventory}
                className="flex items-center justify-between rounded-[1.25rem] border border-[#e7ebf7] bg-white px-4 py-4 text-right font-black text-[#7b6dff] transition-all hover:bg-[#f7f6ff]"
              >
                <span>فحص المخزون والبواقي</span>
                <Boxes size={18} />
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            {miniStats.map((stat) => {
              const Icon = stat.icon

              return (
                <div key={stat.label} className="alu-panel rounded-[1.6rem] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`rounded-[0.95rem] p-2.5 ${stat.tone}`}>
                      <Icon size={18} />
                    </div>
                    <ArrowUpRight size={16} className="text-[#ccd2e5]" />
                  </div>

                  <div className="mt-4 text-[12px] font-black text-[var(--alu-text-soft)]">
                    {stat.label}
                  </div>
                  <div className="mt-2 text-xl font-black text-[var(--alu-text)]">{stat.value}</div>
                  <div className="mt-1 text-xs font-bold text-[var(--alu-text-soft)]">
                    {stat.helper}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

export default ProductionDashboard
