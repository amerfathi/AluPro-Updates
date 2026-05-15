import { useEffect, useMemo } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Layers,
  Plus,
  Save,
  Scissors,
  Sparkles,
  Trash2,
  Upload,
  Wand2
} from 'lucide-react'
import { createDefaultWindowSection } from '../../data/defaults.js'
import { buildProfileSelectionPlan, evaluateProductionInputReadiness } from '../../domain/index.js'
import { parseArabicNum } from '../../utils/number.js'

const sectionTypeOptions = [
  { value: 'fixed', label: 'ثابت' },
  { value: 'sash', label: 'متحرك' }
]

const elementKindOptions = [
  { value: 'window', label: 'نافذة' },
  { value: 'door', label: 'باب' },
  { value: 'facade', label: 'واجهة' }
]

const openingModeOptions = [
  { value: 'auto', label: 'تلقائي حسب التقسيم' },
  { value: 'fixed', label: 'ثابت' },
  { value: 'sliding', label: 'سحاب' },
  { value: 'hinged', label: 'مفصلي' },
  { value: 'mixed', label: 'مختلط (ثابت + متحرك)' }
]

const createQuickPresets = () => [
  {
    id: 'window-sliding',
    label: 'نافذة سحاب',
    helper: 'وحدة سحاب قياسية للشقق',
    payload: {
      elementKind: 'window',
      openingMode: 'sliding',
      width: '2.00',
      height: '1.60',
      quantity: '1',
      label: 'نافذة سحاب قياسية',
      isComplex: false,
      sections: [createDefaultWindowSection(1, 'sash')]
    }
  },
  {
    id: 'door-hinged',
    label: 'باب مفصلي',
    helper: 'باب مفرد مفصلي خارجي',
    payload: {
      elementKind: 'door',
      openingMode: 'hinged',
      width: '1.00',
      height: '2.20',
      quantity: '1',
      label: 'باب مفصلي مفرد',
      isComplex: false,
      sections: [createDefaultWindowSection(1, 'sash')]
    }
  },
  {
    id: 'facade-fixed',
    label: 'واجهة ثابتة',
    helper: 'واجهة مقسمة بقطاع ثابت',
    payload: {
      elementKind: 'facade',
      openingMode: 'fixed',
      width: '4.00',
      height: '2.80',
      quantity: '1',
      label: 'واجهة ثابتة مقسمة',
      isComplex: true,
      sections: [
        { id: 1, type: 'fixed', h: '1.35' },
        { id: 2, type: 'fixed', h: '1.35' }
      ]
    }
  },
  {
    id: 'window-mixed',
    label: 'نافذة مختلطة',
    helper: 'ثابت + متحرك داخل نفس العنصر',
    payload: {
      elementKind: 'window',
      openingMode: 'mixed',
      width: '2.40',
      height: '1.80',
      quantity: '1',
      label: 'نافذة مختلطة',
      isComplex: true,
      sections: [
        { id: 1, type: 'fixed', h: '0.80' },
        { id: 2, type: 'sash', h: '0.95' }
      ]
    }
  }
]

const formatNumber = (value) => Number(value || 0).toLocaleString('en-US')

const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ر.س`

const readModesLabel = (modes = []) => {
  const map = {
    fixed: 'ثابت',
    sliding: 'سحاب',
    hinged: 'مفصلي',
    mixed: 'مختلط'
  }
  return modes.map((mode) => map[mode] || mode).join(' + ')
}

const toPositiveNumber = (value) => Math.max(0, Number(parseArabicNum(value)) || 0)
const safeArray = (value) => (Array.isArray(value) ? value : [])

const emptyObject = {}
const noop = () => {}

const cloneSections = (sections = []) =>
  sections.map((section, index) => ({
    ...section,
    id: section.id || `${Date.now()}-${index}`
  }))

const ProductionCuttingWorkspace = ({
  projectInfo = emptyObject,
  setProjectInfo = noop,
  savedProjects = [],
  onLinkToContract = noop,
  isContractLinked = false,
  inventoryAlerts = [],
  onUseLeftover = noop,
  inputMode = 'window',
  setInputMode = noop,
  onImportFile = noop,
  mainSystemId = '',
  setMainSystemId = noop,
  profiles = [],
  windowInput = emptyObject,
  setWindowInput = noop,
  addSmartWindow = noop,
  previewPieces = [],
  neededPieces = [],
  setNeededPieces = noop,
  neededGlass = [],
  aggregatedAccessories = [],
  aggregatedOperations = [],
  rawCosts = emptyObject,
  totalCost = 0,
  productionOrder = emptyObject,
  saveProject = noop
}) => {
  useEffect(() => {
    if (inputMode !== 'window') {
      setInputMode('window')
    }
  }, [inputMode, setInputMode])

  const quickPresets = useMemo(() => createQuickPresets(), [])

  const readinessState = useMemo(
    () =>
      evaluateProductionInputReadiness({
        profiles,
        windowInput,
        projectInfo,
        mainSystemId
      }),
    [mainSystemId, profiles, projectInfo, windowInput]
  )
  const {
    selectionPlan,
    selectedProfileReview,
    topSuggestedProfile,
    canInsert,
    readinessChecks,
    readinessPercent,
    nextAction,
    advisoryNotes,
    sectionRows
  } = readinessState

  const activeOrder = productionOrder || emptyObject
  const queue = activeOrder.queue || emptyObject
  const procurement = activeOrder.procurement || emptyObject
  const contract = activeOrder.contract || emptyObject

  const updateWindowInput = (field, value) => {
    setWindowInput((prev) => ({
      ...(prev || {}),
      [field]: value
    }))
  }

  const updateSection = (sectionId, field, value) => {
    setWindowInput((prev) => ({
      ...(prev || {}),
      sections: safeArray(prev?.sections).map((section) =>
        section.id === sectionId ? { ...section, [field]: value } : section
      )
    }))
  }

  const addSection = () => {
    setWindowInput((prev) => ({
      ...(prev || {}),
      isComplex: true,
      sections: [...safeArray(prev?.sections), createDefaultWindowSection(Date.now(), 'sash')]
    }))
  }

  const removeSection = (sectionId) => {
    setWindowInput((prev) => {
      const current = safeArray(prev?.sections)
      if (current.length <= 1) return prev
      return {
        ...(prev || {}),
        sections: current.filter((section) => section.id !== sectionId)
      }
    })
  }

  const applyPreset = (presetPayload) => {
    const normalizedPayload = {
      ...presetPayload,
      sections: cloneSections(presetPayload.sections || [])
    }

    setWindowInput((prev) => ({
      ...(prev || {}),
      ...normalizedPayload
    }))

    const presetPlan = buildProfileSelectionPlan(profiles, normalizedPayload)
    if (presetPlan.eligible[0]) {
      setMainSystemId(presetPlan.eligible[0].profileId)
    } else {
      setMainSystemId('')
    }
  }

  const applySmartAutofix = () => {
    const source = windowInput || {}
    const normalized = {
      ...source,
      elementKind: source.elementKind || 'window',
      openingMode: source.openingMode || 'auto',
      width: source.width || '1.50',
      height: source.height || '1.50',
      quantity: source.quantity || '1',
      label: source.label || 'عنصر إنتاج 1'
    }

    let sections = cloneSections(source.sections || [])
    if (sections.length === 0) {
      sections = [
        createDefaultWindowSection(1, normalized.openingMode === 'fixed' ? 'fixed' : 'sash')
      ]
    }

    if (normalized.isComplex) {
      const hasAnyHeight = sections.some((section) => toPositiveNumber(section.h) > 0)
      if (!hasAnyHeight) {
        const targetHeight = toPositiveNumber(normalized.height)
        const evenHeight = targetHeight > 0 ? (targetHeight / sections.length).toFixed(2) : '0.70'
        sections = sections.map((section) => ({ ...section, h: section.h || evenHeight }))
      }
    }

    normalized.sections = sections

    setWindowInput((prev) => ({
      ...(prev || {}),
      ...normalized
    }))

    if (!String(projectInfo?.clientName || '').trim()) {
      setProjectInfo((prev) => ({
        ...(prev || {}),
        clientName: 'عميل جديد'
      }))
    }

    const fixedPlan = buildProfileSelectionPlan(profiles, normalized)
    if (fixedPlan.eligible[0]) {
      setMainSystemId(fixedPlan.eligible[0].profileId)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="alu-panel rounded-[1.35rem] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-[var(--alu-text)]">
            <Layers size={16} />
            بيانات أمر الإنتاج
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-[var(--alu-text-soft)]">اسم العميل</label>
              <input
                type="text"
                className="h-10 w-full rounded-xl border border-[var(--alu-line)] bg-white px-3 text-sm font-bold text-[var(--alu-text)] outline-none focus:border-[var(--alu-accent)]"
                value={projectInfo?.clientName || ''}
                onChange={(event) =>
                  setProjectInfo((prev) => ({ ...(prev || {}), clientName: event.target.value }))
                }
                placeholder="مثال: عميل معرض الزهراء"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-[var(--alu-text-soft)]">
                ربط بعقد (اختياري)
              </label>
              <select
                className="h-10 w-full rounded-xl border border-[var(--alu-line)] bg-white px-3 text-sm font-bold text-[var(--alu-text)] outline-none focus:border-[var(--alu-accent)]"
                value={projectInfo?.id || ''}
                onChange={(event) => onLinkToContract(event.target.value)}
              >
                <option value="">بدون عقد (مقايسة فقط)</option>
                {safeArray(savedProjects).map((project) => (
                  <option key={project.id} value={project.id}>
                    {project?.info?.clientName || 'عقد'} - {project?.info?.date || '-'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-black ${
                isContractLinked
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-[var(--alu-text-soft)]'
              }`}
            >
              {isContractLinked ? 'وضع العقد: خصم ومقارنة مخزون' : 'وضع المقايسة: بدون خصم مخزون'}
            </span>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--alu-line)] bg-white px-3 py-2 text-[11px] font-black text-[var(--alu-text-soft)]">
              <Upload size={14} />
              استيراد مقاسات من ملف
              <input
                type="file"
                className="hidden"
                accept=".json,.csv,.xlsx,.xls"
                onChange={onImportFile}
              />
            </label>
            <button
              onClick={applySmartAutofix}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] font-black text-indigo-700 transition-all hover:bg-indigo-100"
            >
              <Wand2 size={13} />
              إصلاح ذكي سريع
            </button>
          </div>
        </div>

        <div className="alu-panel rounded-[1.35rem] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-black text-[var(--alu-text)]">
            <Sparkles size={15} />
            جاهزية التنفيذ
          </div>
          <div className="mb-2 text-xs font-black text-[var(--alu-text-soft)]">
            {readinessPercent}% مكتمل
            {nextAction ? ` • الخطوة التالية: ${nextAction.label}` : ' • جاهز للإدراج'}
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[var(--alu-panel-soft)]">
            <div
              className={`h-full rounded-full transition-all ${
                readinessPercent >= 80
                  ? 'bg-emerald-500'
                  : readinessPercent >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
              }`}
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {readinessChecks.map((check) => (
              <div
                key={check.id}
                className={`rounded-xl border px-2 py-1.5 text-[11px] font-black ${
                  check.done
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-[var(--alu-text-soft)]'
                }`}
              >
                {check.done ? '✓' : '•'} {check.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="alu-panel rounded-[1.35rem] p-4">
        <div className="mb-2 text-sm font-black text-[var(--alu-text)]">سيناريوهات جاهزة (تشغيل سريع)</div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {quickPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.payload)}
              className="rounded-xl border border-[var(--alu-line)] bg-white px-3 py-2 text-right transition-all hover:border-indigo-200 hover:bg-indigo-50"
            >
              <div className="text-xs font-black text-[var(--alu-text)]">{preset.label}</div>
              <div className="mt-1 text-[11px] font-bold text-[var(--alu-text-soft)]">{preset.helper}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="alu-panel rounded-[1.35rem] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-[var(--alu-text)]">
            <Scissors size={16} />
            تعريف العنصر
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-[var(--alu-text-soft)]">نوع العنصر</label>
              <select
                className="h-10 w-full rounded-xl border border-[var(--alu-line)] bg-white px-3 text-sm font-bold text-[var(--alu-text)] outline-none focus:border-[var(--alu-accent)]"
                value={windowInput?.elementKind || 'window'}
                onChange={(event) => updateWindowInput('elementKind', event.target.value)}
              >
                {elementKindOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-[var(--alu-text-soft)]">نمط الفتح</label>
              <select
                className="h-10 w-full rounded-xl border border-[var(--alu-line)] bg-white px-3 text-sm font-bold text-[var(--alu-text)] outline-none focus:border-[var(--alu-accent)]"
                value={windowInput?.openingMode || 'auto'}
                onChange={(event) => updateWindowInput('openingMode', event.target.value)}
              >
                {openingModeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-[var(--alu-text-soft)]">النظام الفني</label>
              <select
                className="h-10 w-full rounded-xl border border-[var(--alu-line)] bg-white px-3 text-sm font-bold text-[var(--alu-text)] outline-none focus:border-[var(--alu-accent)]"
                value={mainSystemId || ''}
                onChange={(event) => setMainSystemId(event.target.value)}
              >
                <option value="">اختر القطاع المناسب</option>
                {selectionPlan.eligible.map((entry) => (
                  <option key={entry.profileId} value={entry.profileId}>
                    {entry.profileName} (متوافق)
                  </option>
                ))}
                {selectionPlan.excluded.length > 0 && <option disabled>--------------------</option>}
                {selectionPlan.excluded.map((entry) => (
                  <option key={entry.profileId} value={entry.profileId}>
                    {entry.profileName} (مستبعد)
                  </option>
                ))}
              </select>
              {topSuggestedProfile && (
                <button
                  onClick={() => setMainSystemId(topSuggestedProfile.profileId)}
                  className="mt-1 inline-flex h-8 items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 text-[10px] font-black text-indigo-700 transition-all hover:bg-indigo-100"
                >
                  تطبيق الترشيح الذكي: {topSuggestedProfile.profileName}
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-[var(--alu-text-soft)]">العرض (م)</label>
              <input
                type="text"
                className="h-10 w-full rounded-xl border border-[var(--alu-line)] bg-white px-3 text-center text-sm font-black text-[var(--alu-text)] outline-none focus:border-[var(--alu-accent)]"
                value={windowInput?.width || ''}
                onChange={(event) => updateWindowInput('width', event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-[var(--alu-text-soft)]">الارتفاع (م)</label>
              <input
                type="text"
                className="h-10 w-full rounded-xl border border-[var(--alu-line)] bg-white px-3 text-center text-sm font-black text-[var(--alu-text)] outline-none focus:border-[var(--alu-accent)]"
                value={windowInput?.height || ''}
                onChange={(event) => updateWindowInput('height', event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-[var(--alu-text-soft)]">العدد</label>
              <input
                type="text"
                className="h-10 w-full rounded-xl border border-[var(--alu-line)] bg-white px-3 text-center text-sm font-black text-[var(--alu-text)] outline-none focus:border-[var(--alu-accent)]"
                value={windowInput?.quantity || ''}
                onChange={(event) => updateWindowInput('quantity', event.target.value)}
              />
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            <label className="text-[11px] font-black text-[var(--alu-text-soft)]">مسمى العنصر</label>
            <input
              type="text"
              className="h-10 w-full rounded-xl border border-[var(--alu-line)] bg-white px-3 text-sm font-bold text-[var(--alu-text)] outline-none focus:border-[var(--alu-accent)]"
              value={windowInput?.label || ''}
              onChange={(event) => updateWindowInput('label', event.target.value)}
            />
          </div>

          <div className="mt-3 rounded-xl border border-[var(--alu-line)] bg-white p-3">
            <label className="mb-2 inline-flex items-center gap-2 text-xs font-black text-[var(--alu-text-soft)]">
              <input
                type="checkbox"
                checked={Boolean(windowInput?.isComplex)}
                onChange={(event) => updateWindowInput('isComplex', event.target.checked)}
              />
              يحتوي على تقسيمات رأسية/أفقية داخلية
            </label>

            {Boolean(windowInput?.isComplex) && (
              <div className="space-y-2">
                {sectionRows.map((section, index) => (
                  <div
                    key={section.id}
                    className="grid gap-2 rounded-lg border border-[var(--alu-line)] bg-[var(--alu-panel-soft)] px-2 py-2 md:grid-cols-[1fr_1fr_auto]"
                  >
                    <select
                      className="h-9 rounded-lg border border-[var(--alu-line)] bg-white px-2 text-xs font-black text-[var(--alu-text)] outline-none focus:border-[var(--alu-accent)]"
                      value={section.type || 'sash'}
                      onChange={(event) => updateSection(section.id, 'type', event.target.value)}
                    >
                      {sectionTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {`قسم ${index + 1} - ${option.label}`}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      className="h-9 rounded-lg border border-[var(--alu-line)] bg-white px-2 text-center text-xs font-black text-[var(--alu-text)] outline-none focus:border-[var(--alu-accent)]"
                      value={section.h || ''}
                      onChange={(event) => updateSection(section.id, 'h', event.target.value)}
                      placeholder="ارتفاع القسم (م)"
                    />
                    <button
                      onClick={() => removeSection(section.id)}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 text-rose-600 transition-all hover:bg-rose-100"
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addSection}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-dashed border-[var(--alu-accent)] px-3 text-xs font-black text-[var(--alu-accent)] transition-all hover:bg-indigo-50"
                >
                  <Plus size={14} />
                  إضافة قسم
                </button>
              </div>
            )}
          </div>

          {advisoryNotes.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              {advisoryNotes.map((note) => (
                <div key={note} className="text-[11px] font-black text-amber-700">
                  • {note}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={addSmartWindow}
              disabled={!canInsert}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--alu-accent)] px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(85,104,255,0.24)] transition-all hover:bg-[var(--alu-accent-strong)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <Scissors size={15} />
              إدراج إلى أمر الإنتاج
            </button>
            <button
              onClick={saveProject}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-700 transition-all hover:bg-emerald-100"
            >
              <Save size={15} />
              حفظ المقايسة
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="alu-panel rounded-[1.35rem] p-4">
            <div className="mb-2 text-sm font-black text-[var(--alu-text)]">منطق اختيار القطاعات</div>
            <div className="text-[11px] font-bold text-[var(--alu-text-soft)]">
              المتوافق: {formatNumber(selectionPlan.eligible.length)} | المستبعد:{' '}
              {formatNumber(selectionPlan.excluded.length)}
            </div>
            {!selectionPlan.hasEligibleProfiles && (
              <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-black text-rose-700">
                لا يوجد قطاع متوافق مع نوع العنصر الحالي. غيّر نوع العنصر أو نمط الفتح أو راجع الكتالوج.
              </div>
            )}

            {selectedProfileReview && !selectedProfileReview.eligible && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-black text-rose-700">
                  <AlertCircle size={14} />
                  القطاع المختار غير متوافق مع نوع العنصر الحالي
                </div>
                {selectedProfileReview.exclusions.map((reason) => (
                  <div key={reason} className="text-[11px] font-bold text-rose-700">
                    • {reason}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
              {selectionPlan.eligible.map((entry) => (
                <button
                  key={entry.profileId}
                  onClick={() => setMainSystemId(entry.profileId)}
                  className={`w-full rounded-xl border px-3 py-2 text-right transition-all ${
                    String(mainSystemId) === entry.profileId
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-[var(--alu-line)] bg-white hover:bg-[var(--alu-panel-soft)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-black text-[var(--alu-text)]">{entry.profileName}</div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                      <CheckCircle2 size={11} /> متوافق
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] font-bold text-[var(--alu-text-soft)]">
                    أنماط مدعومة: {readModesLabel(entry.capabilities?.modes)}
                  </div>
                </button>
              ))}

              {selectionPlan.excluded.map((entry) => (
                <div
                  key={entry.profileId}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-black text-amber-800">{entry.profileName}</div>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
                      مستبعد
                    </span>
                  </div>
                  {entry.exclusions.map((reason) => (
                    <div key={reason} className="mt-1 text-[10px] font-bold text-amber-700">
                      • {reason}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="alu-panel rounded-[1.35rem] p-4">
            <div className="mb-2 text-sm font-black text-[var(--alu-text)]">معاينة القطع الناتجة</div>
            <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
              {safeArray(previewPieces).length === 0 && (
                <div className="rounded-xl border border-dashed border-[var(--alu-line)] px-3 py-5 text-center text-xs font-bold text-[var(--alu-text-soft)]">
                  اختر قطاعًا وأدخل المقاسات لتظهر القطع التقديرية.
                </div>
              )}
              {safeArray(previewPieces).map((piece) => (
                <div
                  key={piece.tempId}
                  className="flex items-center justify-between rounded-lg border border-[var(--alu-line)] bg-white px-2 py-1.5"
                >
                  <div className="text-[11px] font-bold text-[var(--alu-text)]">{piece.label}</div>
                  <div className="text-[11px] font-black text-[var(--alu-accent)]">{piece.length} م</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="alu-panel rounded-[1.35rem] p-4">
          <div className="mb-3 text-sm font-black text-[var(--alu-text)]">القطع المعتمدة للمقايسة</div>
          <div className="max-h-60 overflow-y-auto rounded-xl border border-[var(--alu-line)]">
            <table className="w-full text-right">
              <thead className="bg-[var(--alu-panel-soft)]">
                <tr>
                  <th className="px-2 py-2 text-[11px] font-black text-[var(--alu-text-soft)]">البيان</th>
                  <th className="px-2 py-2 text-[11px] font-black text-[var(--alu-text-soft)]">الطول</th>
                  <th className="px-2 py-2 text-[11px] font-black text-[var(--alu-text-soft)]">العدد</th>
                  <th className="px-2 py-2 text-[11px] font-black text-[var(--alu-text-soft)]">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {safeArray(neededPieces).length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-2 py-4 text-center text-xs font-bold text-[var(--alu-text-soft)]"
                    >
                      لا توجد قطع مضافة بعد.
                    </td>
                  </tr>
                )}
                {safeArray(neededPieces).map((piece) => (
                  <tr key={piece.id} className="border-t border-[var(--alu-line)] bg-white">
                    <td className="px-2 py-2 text-xs font-bold text-[var(--alu-text)]">{piece.label}</td>
                    <td className="px-2 py-2 text-xs font-black text-[var(--alu-accent)]">
                      {piece.length} م
                    </td>
                    <td className="px-2 py-2 text-xs font-black text-[var(--alu-text)]">{piece.quantity}</td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() =>
                          setNeededPieces((prev) =>
                            safeArray(prev).filter((item) => item.id !== piece.id)
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-black text-rose-600"
                      >
                        <Trash2 size={12} />
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="alu-panel rounded-[1.35rem] p-4">
            <div className="mb-3 text-sm font-black text-[var(--alu-text)]">ملخص التكلفة والتنفيذ</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--alu-line)] bg-white px-3 py-2">
                <div className="text-[11px] font-black text-[var(--alu-text-soft)]">تكلفة الألمنيوم</div>
                <div className="mt-1 text-xs font-black text-[var(--alu-text)]">
                  {formatMoney(rawCosts.aluminumCost)}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--alu-line)] bg-white px-3 py-2">
                <div className="text-[11px] font-black text-[var(--alu-text-soft)]">تكلفة الزجاج</div>
                <div className="mt-1 text-xs font-black text-[var(--alu-text)]">
                  {formatMoney(rawCosts.glassCost)}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--alu-line)] bg-white px-3 py-2">
                <div className="text-[11px] font-black text-[var(--alu-text-soft)]">تكلفة الإكسسوارات</div>
                <div className="mt-1 text-xs font-black text-[var(--alu-text)]">
                  {formatMoney(rawCosts.accessoriesCost)}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--alu-line)] bg-white px-3 py-2">
                <div className="text-[11px] font-black text-[var(--alu-text-soft)]">تكلفة التشغيل</div>
                <div className="mt-1 text-xs font-black text-[var(--alu-text)]">
                  {formatMoney(rawCosts.operationsCost)}
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-black text-indigo-700">
              التكلفة الداخلية الإجمالية: {formatMoney(totalCost)}
            </div>

            {isContractLinked && (
              <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                قيمة العقد: {formatMoney(contract.contractValue)} | المدفوع:{' '}
                {formatMoney(contract.paidAmount)} | المتبقي: {formatMoney(contract.remainingBalance)} |
                الربح المتوقع: {formatMoney(contract.expectedProfit)}
              </div>
            )}
          </div>

          <div className="alu-panel rounded-[1.35rem] p-4">
            <div className="mb-2 text-sm font-black text-[var(--alu-text)]">الزجاج والإكسسوارات والتشغيل</div>
            <div className="text-[11px] font-bold text-[var(--alu-text-soft)]">
              زجاج: {formatNumber(safeArray(neededGlass).length)} بند | إكسسوارات:{' '}
              {formatNumber(safeArray(aggregatedAccessories).length)} بند | تشغيل:{' '}
              {formatNumber(safeArray(aggregatedOperations).length)} بند
            </div>

            {safeArray(inventoryAlerts).length > 0 && (
              <div className="mt-3 space-y-2">
                {safeArray(inventoryAlerts).map((alert) => (
                  <div
                    key={alert.leftoverId}
                    className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-[11px] font-bold text-cyan-800"
                  >
                    {alert.msg}
                    <button
                      onClick={() => onUseLeftover(alert.leftoverId)}
                      className="mr-2 rounded-lg border border-cyan-200 bg-white px-2 py-0.5 text-[10px] font-black text-cyan-700"
                    >
                      تم الاستخدام
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductionCuttingWorkspace
