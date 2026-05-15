import { useMemo } from 'react'
import {
  AlertCircle,
  Boxes,
  Building2,
  Calculator,
  FileJson,
  Frame,
  Layout,
  ListChecks,
  Package,
  Save,
  Scissors,
  Sparkles,
  Trash2,
  Wallet
} from 'lucide-react'
import VisualDesigner from '../../VisualDesigner.jsx'
import SmartAssemblyBuilder from './SmartAssemblyBuilder.jsx'
import { createDefaultWindowSection } from '../../data/defaults.js'
import { groupIdenticalBars } from '../../utils/aluCalculations.js'

const formatCurrency = (value) => `${Number(value || 0).toLocaleString()} ر.س`
const formatMeters = (value) => `${Number(value || 0).toFixed(3)} م`

const MetricCard = ({ icon: Icon, label, value, hint, accent, soft }) => (
  <div className="alu-panel rounded-[1.5rem] p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-[12px] font-black text-[var(--alu-text-soft)]">{label}</div>
        <div className="mt-3 text-[1.7rem] font-black tracking-tight text-[var(--alu-text)]">
          {value}
        </div>
        <div className="mt-2 text-xs font-bold text-[var(--alu-text-soft)]">{hint}</div>
      </div>

      <div
        className="flex h-11 w-11 items-center justify-center rounded-[1rem]"
        style={{ color: accent, backgroundColor: soft }}
      >
        <Icon size={20} />
      </div>
    </div>
  </div>
)

const ProductionCuttingWorkspace = ({
  projectInfo,
  setProjectInfo,
  savedProjects,
  onLinkToContract,
  isContractLinked,
  inventoryAlerts,
  onUseLeftover,
  inputMode,
  setInputMode,
  onImportFile,
  mainSystemId,
  setMainSystemId,
  profiles,
  windowInput,
  setWindowInput,
  addSmartWindow,
  previewPieces,
  neededPieces,
  setNeededPieces,
  neededGlass,
  aggregatedAccessories,
  aggregatedOperations,
  currentProjectResults,
  rawCosts,
  totalCost,
  financialSummary,
  saveProject,
  masterInventory,
  onVisualSave,
  onAssemblySave
}) => {
  const selectedProfile = profiles.find((profile) => String(profile.id) === String(mainSystemId))
  const linkedContractItems =
    isContractLinked && projectInfo.contractItems?.length && projectInfo.contractItems[0]?.name
      ? projectInfo.contractItems
      : []

  const totalApprovedPieces = neededPieces.reduce(
    (sum, piece) => sum + (Number(piece.quantity) || 0),
    0
  )
  const totalGlassQty = neededGlass.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  const totalAccessoriesQty = aggregatedAccessories.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  )
  const totalOperationsQty = aggregatedOperations.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  )

  const cuttingGroups = useMemo(
    () =>
      currentProjectResults.map((group) => ({
        ...group,
        groupedBars: groupIdenticalBars(group.bars),
        totalCuts: group.pieces.reduce((sum, piece) => sum + (Number(piece.quantity) || 0), 0),
        remainingLength: group.bars.reduce((sum, bar) => sum + (Number(bar.remaining) || 0), 0)
      })),
    [currentProjectResults]
  )

  const totalBars = cuttingGroups.reduce((sum, group) => sum + group.bars.length, 0)

  const metricCards = [
    {
      label: 'قطع معتمدة',
      value: totalApprovedPieces.toLocaleString(),
      hint: `${neededPieces.length.toLocaleString()} بند قص`,
      icon: ListChecks,
      accent: '#5568ff',
      soft: '#eef1ff'
    },
    {
      label: 'أعواد مبدئية',
      value: totalBars.toLocaleString(),
      hint: `${cuttingGroups.length.toLocaleString()} مجموعة قطاع`,
      icon: Scissors,
      accent: '#2bb5a7',
      soft: '#ebfbf8'
    },
    {
      label: 'تكلفة داخلية',
      value: formatCurrency(totalCost),
      hint: `${formatCurrency(rawCosts.aluminumCost)} ألمنيوم + ${formatCurrency(rawCosts.operationsCost)} تشغيل`,
      icon: Wallet,
      accent: '#6c5ce7',
      soft: '#f2efff'
    },
    {
      label: 'زجاج / إكسسوار / تشغيل',
      value: `${totalGlassQty.toLocaleString()} / ${totalAccessoriesQty.toLocaleString()} / ${totalOperationsQty.toLocaleString()}`,
      hint: `${inventoryAlerts.length.toLocaleString()} تنبيه بواقي`,
      icon: Boxes,
      accent: '#ff7e9f',
      soft: '#fff1f6'
    }
  ]

  const applyContractItem = (item) => {
    if (!item.profileId) {
      alert('⚠️ هذا البند غير مربوط بقطاع بعد. حدده أولًا من شاشة العقد.')
      return
    }

    setMainSystemId(String(item.profileId))
    setWindowInput((prev) => ({
      ...prev,
      label: item.name,
      quantity: item.qty || '1'
    }))
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="alu-panel-strong rounded-[2rem] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eef1ff] px-3 py-1.5 text-[11px] font-black text-[#5568ff]">
                <Sparkles size={14} />
                مساحة تشغيل القص
              </div>
              <h3 className="mt-4 text-2xl font-black text-[var(--alu-text)]">
                تحويل المقاسات إلى أمر إنتاج فعلي
              </h3>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-[var(--alu-text-soft)]">
                اربط العميل والعقد والقطاع ثم أضف النوافذ والأبواب، مع قراءة فورية للقص والخامات قبل
                الحفظ.
              </p>
            </div>

            <div className="rounded-[1.2rem] bg-[#f7f9ff] px-4 py-3 text-right">
              <div className="text-[11px] font-black text-[var(--alu-text-soft)]">
                القطاع الحالي
              </div>
              <div className="mt-2 text-sm font-black text-[var(--alu-text)]">
                {selectedProfile?.name || 'غير محدد'}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-black text-[var(--alu-text-soft)]">
                <Building2 size={16} />
                اسم العميل
              </label>
              <input
                type="text"
                value={projectInfo.clientName || ''}
                onChange={(event) =>
                  setProjectInfo((prev) => ({ ...prev, clientName: event.target.value }))
                }
                className="w-full px-4 py-3"
                placeholder="أدخل اسم العميل أو الجهة..."
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-black text-[var(--alu-text-soft)]">
                <ListChecks size={16} />
                ربط بعقد محفوظ
              </label>
              <select
                className="w-full px-4 py-3"
                value={isContractLinked ? projectInfo.id || '' : ''}
                onChange={(event) => onLinkToContract(event.target.value)}
              >
                <option value="">بدون عقد (مقايسة حرة)</option>
                {savedProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    عقد: {project.info.clientName} - {project.info.date}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {metricCards.map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      {linkedContractItems.length > 0 && (
        <section className="alu-panel rounded-[1.7rem] p-5">
          <div className="flex items-center gap-2 text-sm font-black text-[var(--alu-text)]">
            <ListChecks size={18} />
            بنود العقد الجاهزة للإدخال
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {linkedContractItems.map((item) => (
              <button
                key={item.id}
                onClick={() => applyContractItem(item)}
                className="rounded-[1.1rem] border border-[rgba(225,230,246,0.95)] bg-white px-4 py-3 text-right shadow-sm transition-all hover:border-[rgba(85,104,255,0.22)] hover:shadow-[0_14px_26px_rgba(85,104,255,0.12)]"
              >
                <div className="text-sm font-black text-[var(--alu-text)]">{item.name}</div>
                <div className="mt-1 text-[11px] font-bold text-[var(--alu-text-soft)]">
                  الكمية: {item.qty || '1'} · المساحة: {item.sqm || '0'}م²
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {inventoryAlerts.length > 0 && (
        <section className="alu-panel rounded-[1.7rem] border-[rgba(255,141,173,0.18)] bg-[var(--alu-danger-soft)] p-5">
          <div className="flex items-center gap-2 text-sm font-black text-[#d75d86]">
            <AlertCircle size={18} />
            تنبيهات الاستفادة من البواقي
          </div>
          <div className="mt-4 grid gap-3">
            {inventoryAlerts.map((alert, index) => (
              <div
                key={`${alert.leftoverId}-${index}`}
                className="flex flex-col gap-3 rounded-[1.2rem] border border-white/70 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="text-sm font-black text-[var(--alu-text)]">{alert.msg}</div>
                <button
                  onClick={() => onUseLeftover(alert.leftoverId)}
                  className="rounded-[0.95rem] bg-[#fff1f6] px-4 py-2 text-xs font-black text-[#ff6d96] transition-all hover:bg-[#ffe7f0]"
                >
                  تم استخدام الفضلة
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="alu-panel rounded-[1.7rem] p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setInputMode('window')}
              className={`rounded-[1.15rem] px-5 py-3 text-sm font-black transition-all ${
                inputMode === 'window'
                  ? 'bg-[var(--alu-accent)] text-white shadow-[0_18px_30px_rgba(85,104,255,0.24)]'
                  : 'bg-[#f7f9ff] text-[var(--alu-text-soft)] hover:bg-[#eef1ff] hover:text-[var(--alu-accent)]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Frame size={16} />
                النوافذ والأبواب
              </span>
            </button>

            <button
              onClick={() => setInputMode('assembly')}
              className={`rounded-[1.15rem] px-5 py-3 text-sm font-black transition-all ${
                inputMode === 'assembly'
                  ? 'bg-[#0ea5a4] text-white shadow-[0_18px_30px_rgba(14,165,164,0.24)]'
                  : 'bg-[#f7f9ff] text-[var(--alu-text-soft)] hover:bg-[#ecfffd] hover:text-[#0ea5a4]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Boxes size={16} />
                التجميعة الذكية
              </span>
            </button>

            <button
              onClick={() => setInputMode('visual')}
              className={`rounded-[1.15rem] px-5 py-3 text-sm font-black transition-all ${
                inputMode === 'visual'
                  ? 'bg-[#6c5ce7] text-white shadow-[0_18px_30px_rgba(108,92,231,0.24)]'
                  : 'bg-[#f7f9ff] text-[var(--alu-text-soft)] hover:bg-[#f2efff] hover:text-[#6c5ce7]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Layout size={16} />
                الرسم المرئي للواجهات
              </span>
            </button>
          </div>

          <div className="relative">
            <input
              type="file"
              id="production-import-file"
              accept=".alu,.json"
              className="hidden"
              onChange={onImportFile}
            />
            <label
              htmlFor="production-import-file"
              className="inline-flex cursor-pointer items-center gap-2 rounded-[1.15rem] bg-[#2ec5b5] px-5 py-3 text-sm font-black text-white transition-all hover:bg-[#25b4a4]"
            >
              <FileJson size={16} />
              استيراد بيانات
            </label>
          </div>
        </div>
      </section>

      {inputMode === 'window' ? (
        <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="alu-panel-strong rounded-[2rem] p-6">
            <div className="flex items-center gap-2 text-base font-black text-[var(--alu-text)]">
              <Calculator size={18} />
              إدخال عنصر إنتاج جديد
            </div>
            <div className="mt-5 space-y-5">
              <div className="rounded-[1.5rem] bg-[#f7f9ff] p-5">
                <label className="mb-2 flex items-center gap-2 text-sm font-black text-[var(--alu-text-soft)]">
                  <Package size={16} />
                  القطاع
                </label>
                {isContractLinked ? (
                  <div className="flex items-center justify-between gap-3 rounded-[1rem] border border-[rgba(225,230,246,0.95)] bg-white px-4 py-3">
                    <span className="font-black text-[var(--alu-text)]">
                      {selectedProfile?.name || 'يرجى اختيار بند من العقد أولًا'}
                    </span>
                    <span className="rounded-full bg-[#eef1ff] px-3 py-1 text-[11px] font-black text-[#5568ff]">
                      مربوط بالعقد
                    </span>
                  </div>
                ) : (
                  <select
                    value={mainSystemId}
                    onChange={(event) => setMainSystemId(event.target.value)}
                    className="w-full px-4 py-3"
                  >
                    <option value="">اختر القطاع يدويًا</option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  value={windowInput.width || ''}
                  onChange={(event) =>
                    setWindowInput((prev) => ({ ...prev, width: event.target.value }))
                  }
                  className="w-full px-4 py-3 text-center"
                  placeholder="العرض الكلي (م)"
                />
                <input
                  type="text"
                  value={windowInput.height || ''}
                  onChange={(event) =>
                    setWindowInput((prev) => ({ ...prev, height: event.target.value }))
                  }
                  className="w-full px-4 py-3 text-center"
                  placeholder="الارتفاع الكلي (م)"
                />
                <input
                  type="text"
                  value={windowInput.quantity || ''}
                  onChange={(event) =>
                    setWindowInput((prev) => ({ ...prev, quantity: event.target.value }))
                  }
                  className="w-full px-4 py-3 text-center"
                  placeholder="الكمية"
                />
                <input
                  type="text"
                  value={windowInput.label || ''}
                  onChange={(event) =>
                    setWindowInput((prev) => ({ ...prev, label: event.target.value }))
                  }
                  className="w-full px-4 py-3 text-center"
                  placeholder="المسمى"
                />
              </div>

              <div className="rounded-[1.5rem] border border-[rgba(225,230,246,0.95)] bg-[#f8faff] p-5">
                <label className="flex items-center gap-3 text-sm font-black text-[var(--alu-text)]">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded accent-[var(--alu-accent)]"
                    checked={windowInput.isComplex}
                    onChange={(event) =>
                      setWindowInput((prev) => ({ ...prev, isComplex: event.target.checked }))
                    }
                  />
                  تقسيم العنصر إلى عدة مقاطع
                </label>

                {windowInput.isComplex ? (
                  <div className="mt-5 space-y-3">
                    {(windowInput.sections || []).map((section, index) => (
                      <div
                        key={section.id}
                        className="grid gap-3 rounded-[1.1rem] border border-[rgba(225,230,246,0.95)] bg-white p-4 sm:grid-cols-[0.6fr_1fr_auto]"
                      >
                        <input
                          type="text"
                          value={section.h ?? ''}
                          onChange={(event) => {
                            const nextSections = [...(windowInput.sections || [])]
                            nextSections[index] = {
                              ...nextSections[index],
                              h: event.target.value
                            }
                            setWindowInput((prev) => ({ ...prev, sections: nextSections }))
                          }}
                          className="w-full px-4 py-3 text-center"
                          placeholder="ارتفاع القسم (م)"
                        />
                        <select
                          value={section.type ?? 'sash'}
                          onChange={(event) => {
                            const nextSections = [...(windowInput.sections || [])]
                            nextSections[index] = {
                              ...nextSections[index],
                              type: event.target.value
                            }
                            setWindowInput((prev) => ({ ...prev, sections: nextSections }))
                          }}
                          className="w-full px-4 py-3"
                        >
                          <option value="fixed">قسم ثابت</option>
                          <option value="sash">قسم متحرك</option>
                        </select>
                        {(windowInput.sections || []).length > 2 && (
                          <button
                            onClick={() =>
                              setWindowInput((prev) => ({
                                ...prev,
                                sections: prev.sections.filter(
                                  (current) => current.id !== section.id
                                )
                              }))
                            }
                            className="rounded-lg bg-[#fff1f6] p-3 text-[#ff6d96]"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={() =>
                        setWindowInput((prev) => ({
                          ...prev,
                          sections: [
                            ...(prev.sections || []),
                            createDefaultWindowSection(Date.now())
                          ]
                        }))
                      }
                      className="w-full rounded-[1.1rem] border border-dashed border-[rgba(85,104,255,0.28)] bg-[#f7f9ff] px-4 py-3 text-sm font-black text-[var(--alu-accent)]"
                    >
                      إضافة قسم جديد
                    </button>
                  </div>
                ) : (
                  <select
                    value={windowInput.sections?.[0]?.type || 'sash'}
                    onChange={(event) => {
                      const nextSections = [...(windowInput.sections || [{ id: 1 }])]
                      nextSections[0] = { ...nextSections[0], type: event.target.value }
                      setWindowInput((prev) => ({ ...prev, sections: nextSections }))
                    }}
                    className="mt-5 w-full px-4 py-3"
                  >
                    <option value="sash">نافذة أو باب متحرك</option>
                    <option value="fixed">نافذة أو واجهة ثابتة</option>
                  </select>
                )}
              </div>

              <button
                onClick={addSmartWindow}
                className="flex w-full items-center justify-center gap-3 rounded-[1.35rem] bg-[var(--alu-accent)] px-5 py-4 text-base font-black text-white shadow-[0_20px_36px_rgba(85,104,255,0.24)] transition-all hover:bg-[#485cf6]"
              >
                <Scissors size={20} />
                إدراج للمقايسة وأمر القص
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="alu-panel-strong rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-base font-black text-[var(--alu-text)]">
                  معاينة فورية للاستهلاك
                </div>
                <div className="rounded-full bg-[#eef1ff] px-3 py-1 text-[11px] font-black text-[#5568ff]">
                  {selectedProfile?.name || 'بدون قطاع'}
                </div>
              </div>

              {windowInput.width && windowInput.height && mainSystemId ? (
                <div className="alu-scrollbar mt-5 max-h-[31rem] space-y-2 overflow-y-auto rounded-[1.35rem] bg-[#f8faff] p-3">
                  {previewPieces.length > 0 ? (
                    previewPieces.map((piece) => (
                      <div
                        key={piece.tempId}
                        className="flex items-center justify-between gap-3 rounded-[1rem] border border-white/70 bg-white px-3.5 py-3"
                      >
                        <div className="min-w-0 flex-1 text-sm font-black leading-6 text-[var(--alu-text)]">
                          {String(piece.label).replace(`${windowInput.label || ''} - `, '')}
                        </div>
                        <div className="shrink-0 rounded-full bg-[#eef1ff] px-3 py-1 text-[11px] font-black text-[#5568ff]">
                          {formatMeters(piece.length)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.2rem] border border-dashed border-[rgba(225,230,246,0.95)] bg-white px-4 py-6 text-center text-sm font-bold text-[var(--alu-text-soft)]">
                      لا توجد معاينة قطع بعد. أكمل المقاسات أو راجع معادلات القطاع.
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-5 flex min-h-[20rem] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[rgba(225,230,246,0.95)] bg-[#f8faff] px-6 text-center">
                  <Frame size={44} className="text-[var(--alu-text-soft)]" />
                  <div className="mt-4 text-base font-black text-[var(--alu-text)]">
                    اختر القطاع وأدخل المقاس للبدء
                  </div>
                </div>
              )}
            </div>

            <div className="alu-panel rounded-[1.8rem] p-6">
              <div className="flex items-center gap-2 text-base font-black text-[var(--alu-text)]">
                <Wallet size={18} />
                قراءة خامات أولية
              </div>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-[1rem] bg-[#f8faff] px-4 py-3">
                  <span className="text-sm font-black text-[var(--alu-text)]">ألمنيوم</span>
                  <span className="text-sm font-black text-[#5568ff]">
                    {formatCurrency(rawCosts.aluminumCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-[1rem] bg-[#f8faff] px-4 py-3">
                  <span className="text-sm font-black text-[var(--alu-text)]">زجاج</span>
                  <span className="text-sm font-black text-[#2bb5a7]">
                    {formatCurrency(rawCosts.glassCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-[1rem] bg-[#f8faff] px-4 py-3">
                  <span className="text-sm font-black text-[var(--alu-text)]">إكسسوارات</span>
                  <span className="text-sm font-black text-[#6c5ce7]">
                    {formatCurrency(rawCosts.accessoriesCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-[1rem] bg-[#f8faff] px-4 py-3">
                  <span className="text-sm font-black text-[var(--alu-text)]">تشغيل وتجميع</span>
                  <span className="text-sm font-black text-[#0ea5a4]">
                    {formatCurrency(rawCosts.operationsCost)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : inputMode === 'assembly' ? (
        <section className="alu-panel-strong rounded-[2rem] p-5">
          <SmartAssemblyBuilder profiles={profiles} onInsert={onAssemblySave} />
        </section>
      ) : (
        <section className="alu-panel-strong rounded-[2rem] p-5">
          <VisualDesigner profiles={profiles} inventory={masterInventory} onSave={onVisualSave} />
        </section>
      )}

      <section className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
        <div className="alu-panel-strong rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-base font-black text-[var(--alu-text)]">
                <ListChecks size={18} />
                القطع المعتمدة للمقايسة
              </div>
              <div className="mt-1 text-sm font-bold text-[var(--alu-text-soft)]">
                هذه القائمة هي المرجع المباشر لخريطة القص والتقارير والمخزون.
              </div>
            </div>
            <div className="rounded-full bg-[#eef1ff] px-3 py-1 text-[11px] font-black text-[#5568ff]">
              {totalApprovedPieces.toLocaleString()} قطعة
            </div>
          </div>

          {neededPieces.length > 0 ? (
            <div className="alu-scrollbar mt-5 overflow-x-auto">
              <table className="min-w-full text-right text-sm">
                <thead className="text-[var(--alu-text-soft)]">
                  <tr className="border-b border-[rgba(225,230,246,0.95)]">
                    <th className="px-3 py-4 font-black">النافذة أو البند</th>
                    <th className="px-3 py-4 font-black">الطول</th>
                    <th className="px-3 py-4 font-black">العدد</th>
                    <th className="px-3 py-4 font-black">القص</th>
                    <th className="px-3 py-4 font-black"></th>
                  </tr>
                </thead>
                <tbody>
                  {neededPieces.map((piece) => (
                    <tr
                      key={piece.id}
                      className="border-b border-[rgba(225,230,246,0.7)] last:border-none"
                    >
                      <td className="px-3 py-4 font-black text-[var(--alu-text)]">{piece.label}</td>
                      <td className="px-3 py-4 font-black text-[#5568ff]">
                        {formatMeters(piece.length)}
                      </td>
                      <td className="px-3 py-4 font-black text-[var(--alu-text)]">
                        {(Number(piece.quantity) || 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-4 font-black text-[var(--alu-text-soft)]">
                        {piece.cutType === '45' ? 'زاوية 45°' : 'مستقيم'}
                      </td>
                      <td className="px-3 py-4">
                        <button
                          onClick={() =>
                            setNeededPieces((prev) =>
                              prev.filter((current) => current.id !== piece.id)
                            )
                          }
                          className="rounded-lg bg-[#fff1f6] p-2 text-[#ff6d96]"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.5rem] border border-dashed border-[rgba(225,230,246,0.95)] bg-[#f8faff] px-6 py-10 text-center text-sm font-bold text-[var(--alu-text-soft)]">
              لا توجد قطع معتمدة بعد. أضف أول نافذة أو باب ليظهر أمر القص هنا.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="alu-panel rounded-[1.8rem] p-6">
            <div className="flex items-center gap-2 text-base font-black text-[var(--alu-text)]">
              <Scissors size={18} />
              ملخص القص المبدئي
            </div>
            <div className="mt-5 space-y-3">
              {cuttingGroups.length > 0 ? (
                cuttingGroups.map((group) => (
                  <div
                    key={`${group.inventoryId || group.itemName}-${group.profileId || 'free'}`}
                    className="rounded-[1.3rem] border border-[rgba(225,230,246,0.95)] bg-[#f8faff] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-[var(--alu-text)]">
                          {group.itemName}
                        </div>
                        <div className="mt-1 text-[11px] font-bold text-[var(--alu-text-soft)]">
                          {group.totalCuts.toLocaleString()} قطعة ·{' '}
                          {group.bars.length.toLocaleString()} عود
                        </div>
                      </div>
                      <div className="rounded-full bg-[#eef1ff] px-3 py-1 text-[11px] font-black text-[#5568ff]">
                        فضلة {formatMeters(group.remainingLength)}
                      </div>
                    </div>
                    {group.groupedBars.slice(0, 2).map((bar, index) => (
                      <div
                        key={`${group.itemName}-${index}`}
                        className="mt-3 rounded-[1rem] bg-white px-3 py-2 text-xs font-black text-[var(--alu-text)]"
                      >
                        {bar.patternCount.toLocaleString()} ×{' '}
                        {bar.cuts.map((cut) => `${Number(cut.length).toFixed(3)}م`).join(' + ')}
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="rounded-[1.2rem] bg-[#f8faff] px-4 py-6 text-center text-sm font-bold text-[var(--alu-text-soft)]">
                  لم تتولد مجموعات قص بعد.
                </div>
              )}
            </div>
          </div>

          <div className="alu-panel-strong rounded-[1.8rem] p-6">
            <div className="flex items-center gap-2 text-base font-black text-[var(--alu-text)]">
              <Save size={18} />
              جاهزية الحفظ
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-[1rem] bg-[#f8faff] px-4 py-3">
                <span className="text-sm font-black text-[var(--alu-text)]">قيمة العقد</span>
                <span className="text-sm font-black text-[var(--alu-text)]">
                  {formatCurrency(financialSummary.contractVal)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[1rem] bg-[#f8faff] px-4 py-3">
                <span className="text-sm font-black text-[var(--alu-text)]">الربحية المتوقعة</span>
                <span className="text-sm font-black text-[#2bb5a7]">
                  {formatCurrency(financialSummary.expectedProfit)}
                </span>
              </div>
            </div>
            <button
              onClick={saveProject}
              disabled={neededPieces.length === 0}
              className={`mt-5 flex w-full items-center justify-center gap-3 rounded-[1.3rem] px-5 py-4 text-base font-black text-white transition-all ${
                neededPieces.length === 0
                  ? 'cursor-not-allowed bg-[#b7bfd5]'
                  : 'bg-[#2ec5b5] shadow-[0_20px_36px_rgba(46,197,181,0.24)] hover:bg-[#25b4a4]'
              }`}
            >
              <Save size={20} />
              {isContractLinked ? 'حفظ وتحديث العقد المرتبط' : 'حفظ المقايسة الحرة'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ProductionCuttingWorkspace
