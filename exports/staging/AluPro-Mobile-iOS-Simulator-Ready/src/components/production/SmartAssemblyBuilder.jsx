import { useMemo, useState } from 'react'
import { Calculator, Columns, LayoutTemplate, Plus, Rows, Save, Trash2 } from 'lucide-react'
import {
  assemblyTemplates,
  compileAssemblyGrid,
  createAssemblyModule,
  createAssemblyStateFromTemplate
} from '../../utils/assemblyLayout.js'
import AssemblyLivePreview from './AssemblyLivePreview.jsx'

const emptyComposerState = () => ({
  width: '2.40',
  height: '2.20',
  quantity: '1',
  label: 'نافذة مركبة 1',
  ...createAssemblyStateFromTemplate('fixed-sash-side', 2.4, 2.2)
})

const SmartAssemblyBuilder = ({ profiles = [], onInsert }) => {
  const [composer, setComposer] = useState(emptyComposerState)

  const frameProfile = profiles.find(
    (profile) => String(profile.id) === String(composer.frameProfileId)
  )

  const compilation = useMemo(
    () =>
      compileAssemblyGrid({
        width: composer.width,
        height: composer.height,
        quantity: composer.quantity,
        label: composer.label,
        frameProfile,
        profiles,
        rows: composer.rows,
        columns: composer.columns,
        modules: composer.modules
      }),
    [composer, frameProfile, profiles]
  )

  const applyTemplate = (templateId) => {
    setComposer((prev) => ({
      ...prev,
      ...createAssemblyStateFromTemplate(templateId, prev.width, prev.height)
    }))
  }

  const updateTrack = (kind, id, value) => {
    setComposer((prev) => ({
      ...prev,
      [kind]: prev[kind].map((track) => (track.id === id ? { ...track, size: value } : track))
    }))
  }

  const appendTrack = (kind, prefix) => {
    setComposer((prev) => ({
      ...prev,
      [kind]: [...prev[kind], { id: `${prefix}-${Date.now()}`, size: '1.00' }]
    }))
  }

  const removeTrack = (kind, id) => {
    setComposer((prev) => {
      if (prev[kind].length <= 1) return prev
      const nextTracks = prev[kind].filter((track) => track.id !== id)
      return { ...prev, [kind]: nextTracks }
    })
  }

  const updateModule = (moduleId, field, value) => {
    setComposer((prev) => ({
      ...prev,
      modules: prev.modules.map((module) =>
        module.id === moduleId ? { ...module, [field]: value } : module
      )
    }))
  }

  const addModule = () => {
    setComposer((prev) => ({
      ...prev,
      modules: [
        ...prev.modules,
        createAssemblyModule({
          row: 0,
          col: 0,
          rowSpan: 1,
          colSpan: 1,
          type: 'sash',
          label: `وحدة ${prev.modules.length + 1}`
        })
      ]
    }))
  }

  const removeModule = (moduleId) => {
    setComposer((prev) => ({
      ...prev,
      modules: prev.modules.filter((module) => module.id !== moduleId)
    }))
  }

  const totalOperations = compilation.operations.reduce(
    (sum, operation) => sum + (Number(operation.quantity) || 0),
    0
  )

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-[rgba(225,230,246,0.95)] bg-[#f7f9ff] p-5">
        <div className="flex items-center gap-2 text-base font-black text-[var(--alu-text)]">
          <LayoutTemplate size={18} />
          التجميعة الذكية متعددة الأنظمة
        </div>
        <p className="mt-2 text-sm font-bold leading-7 text-[var(--alu-text-soft)]">
          استخدم هذه المساحة عندما تحتوي النافذة أو الواجهة على ثابت ومتحرك أو أكثر من نظام فني داخل
          نفس العنصر. اختر نظامًا للإطار والقواطع، ثم اربط كل وحدة بنظامها الفني الخاص.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <AssemblyLivePreview
            visualModel={compilation.visualModel}
            frameProfileName={frameProfile?.name || ''}
          />

          <div className="rounded-[1.6rem] border border-[rgba(225,230,246,0.95)] bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                className="w-full px-4 py-3 text-center"
                value={composer.width}
                onChange={(event) =>
                  setComposer((prev) => ({ ...prev, width: event.target.value }))
                }
                placeholder="العرض الكلي (م)"
              />
              <input
                type="text"
                className="w-full px-4 py-3 text-center"
                value={composer.height}
                onChange={(event) =>
                  setComposer((prev) => ({ ...prev, height: event.target.value }))
                }
                placeholder="الارتفاع الكلي (م)"
              />
              <input
                type="text"
                className="w-full px-4 py-3 text-center"
                value={composer.quantity}
                onChange={(event) =>
                  setComposer((prev) => ({ ...prev, quantity: event.target.value }))
                }
                placeholder="العدد"
              />
              <input
                type="text"
                className="w-full px-4 py-3 text-center"
                value={composer.label}
                onChange={(event) =>
                  setComposer((prev) => ({ ...prev, label: event.target.value }))
                }
                placeholder="اسم التجميعة"
              />
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-sm font-black text-[var(--alu-text-soft)]">
                نظام الإطار والقواطع
              </label>
              <select
                className="w-full px-4 py-3"
                value={composer.frameProfileId}
                onChange={(event) =>
                  setComposer((prev) => ({ ...prev, frameProfileId: event.target.value }))
                }
              >
                <option value="">اختر نظام الإطار الرئيسي</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-[rgba(225,230,246,0.95)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-base font-black text-[var(--alu-text)]">
              <Calculator size={18} />
              قوالب جاهزة للتقسيم
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {assemblyTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  className={`rounded-[1rem] px-4 py-3 text-sm font-black transition-all ${
                    composer.templateId === template.id
                      ? 'bg-[var(--alu-accent)] text-white shadow-[0_18px_30px_rgba(85,104,255,0.24)]'
                      : 'bg-[#f7f9ff] text-[var(--alu-text-soft)] hover:bg-[#eef1ff] hover:text-[var(--alu-accent)]'
                  }`}
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.6rem] border border-[rgba(225,230,246,0.95)] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-black text-[var(--alu-text)]">
                  <Rows size={16} />
                  الصفوف
                </div>
                <button
                  onClick={() => appendTrack('rows', 'row')}
                  className="rounded-full bg-[#eef1ff] p-2 text-[#5568ff]"
                >
                  <Plus size={15} />
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {composer.rows.map((row, index) => (
                  <div key={row.id} className="flex items-center gap-3">
                    <span className="w-14 text-xs font-black text-[var(--alu-text-soft)]">
                      صف {index + 1}
                    </span>
                    <input
                      type="text"
                      className="w-full px-4 py-3 text-center"
                      value={row.size}
                      onChange={(event) => updateTrack('rows', row.id, event.target.value)}
                      placeholder="الارتفاع"
                    />
                    {composer.rows.length > 1 && (
                      <button
                        onClick={() => removeTrack('rows', row.id)}
                        className="rounded-lg bg-[#fff1f6] p-3 text-[#ff6d96]"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-[rgba(225,230,246,0.95)] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-black text-[var(--alu-text)]">
                  <Columns size={16} />
                  الأعمدة
                </div>
                <button
                  onClick={() => appendTrack('columns', 'col')}
                  className="rounded-full bg-[#eef1ff] p-2 text-[#5568ff]"
                >
                  <Plus size={15} />
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {composer.columns.map((column, index) => (
                  <div key={column.id} className="flex items-center gap-3">
                    <span className="w-14 text-xs font-black text-[var(--alu-text-soft)]">
                      عمود {index + 1}
                    </span>
                    <input
                      type="text"
                      className="w-full px-4 py-3 text-center"
                      value={column.size}
                      onChange={(event) => updateTrack('columns', column.id, event.target.value)}
                      placeholder="العرض"
                    />
                    {composer.columns.length > 1 && (
                      <button
                        onClick={() => removeTrack('columns', column.id)}
                        className="rounded-lg bg-[#fff1f6] p-3 text-[#ff6d96]"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-[rgba(225,230,246,0.95)] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="text-base font-black text-[var(--alu-text)]">الوحدات الداخلية</div>
              <button
                onClick={addModule}
                className="rounded-[1rem] bg-[#eef1ff] px-4 py-2 text-xs font-black text-[#5568ff]"
              >
                إضافة وحدة
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {composer.modules.map((module, index) => (
                <div
                  key={module.id}
                  className="rounded-[1.2rem] border border-[rgba(225,230,246,0.95)] bg-[#f8faff] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      className="w-full px-4 py-3"
                      value={module.label}
                      onChange={(event) => updateModule(module.id, 'label', event.target.value)}
                      placeholder={`اسم الوحدة ${index + 1}`}
                    />
                    <button
                      onClick={() => removeModule(module.id)}
                      className="rounded-lg bg-[#fff1f6] p-3 text-[#ff6d96]"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
                    <select
                      className="w-full px-4 py-3"
                      value={module.type}
                      onChange={(event) => updateModule(module.id, 'type', event.target.value)}
                    >
                      <option value="fixed">ثابت</option>
                      <option value="sash">متحرك</option>
                    </select>
                    <select
                      className="w-full px-4 py-3"
                      value={module.profileId}
                      onChange={(event) => updateModule(module.id, 'profileId', event.target.value)}
                    >
                      <option value="">النظام الفني</option>
                      {profiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="w-full px-4 py-3"
                      value={module.row}
                      onChange={(event) =>
                        updateModule(module.id, 'row', Number(event.target.value))
                      }
                    >
                      {composer.rows.map((row, rowIndex) => (
                        <option key={row.id} value={rowIndex}>
                          يبدأ من الصف {rowIndex + 1}
                        </option>
                      ))}
                    </select>
                    <select
                      className="w-full px-4 py-3"
                      value={module.rowSpan}
                      onChange={(event) =>
                        updateModule(module.id, 'rowSpan', Number(event.target.value))
                      }
                    >
                      {Array.from({ length: composer.rows.length }, (_, idx) => idx + 1).map(
                        (value) => (
                          <option key={value} value={value}>
                            يمتد {value} صف
                          </option>
                        )
                      )}
                    </select>
                    <select
                      className="w-full px-4 py-3"
                      value={module.col}
                      onChange={(event) =>
                        updateModule(module.id, 'col', Number(event.target.value))
                      }
                    >
                      {composer.columns.map((column, columnIndex) => (
                        <option key={column.id} value={columnIndex}>
                          يبدأ من العمود {columnIndex + 1}
                        </option>
                      ))}
                    </select>
                    <select
                      className="w-full px-4 py-3"
                      value={module.colSpan}
                      onChange={(event) =>
                        updateModule(module.id, 'colSpan', Number(event.target.value))
                      }
                    >
                      {Array.from({ length: composer.columns.length }, (_, idx) => idx + 1).map(
                        (value) => (
                          <option key={value} value={value}>
                            يمتد {value} عمود
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.6rem] border border-[rgba(225,230,246,0.95)] bg-white p-5 shadow-sm">
            <div className="text-base font-black text-[var(--alu-text)]">ملخص التجميعة</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1rem] bg-[#f7f9ff] p-4">
                <div className="text-xs font-black text-[var(--alu-text-soft)]">الوحدات</div>
                <div className="mt-2 text-2xl font-black text-[var(--alu-text)]">
                  {compilation.stats?.modulesCount || 0}
                </div>
              </div>
              <div className="rounded-[1rem] bg-[#f7f9ff] p-4">
                <div className="text-xs font-black text-[var(--alu-text-soft)]">
                  قواطع رأسية/أفقية
                </div>
                <div className="mt-2 text-2xl font-black text-[var(--alu-text)]">
                  {(compilation.stats?.verticalMullions || 0).toLocaleString()} /{' '}
                  {(compilation.stats?.horizontalMullions || 0).toLocaleString()}
                </div>
              </div>
              <div className="rounded-[1rem] bg-[#f7f9ff] p-4">
                <div className="text-xs font-black text-[var(--alu-text-soft)]">ألمنيوم / زجاج</div>
                <div className="mt-2 text-2xl font-black text-[var(--alu-text)]">
                  {compilation.pieces.length} / {compilation.glass.length}
                </div>
              </div>
              <div className="rounded-[1rem] bg-[#f7f9ff] p-4">
                <div className="text-xs font-black text-[var(--alu-text-soft)]">
                  إكسسوار / تشغيل
                </div>
                <div className="mt-2 text-2xl font-black text-[var(--alu-text)]">
                  {compilation.accessories.length} / {totalOperations}
                </div>
              </div>
            </div>

            {compilation.errors.length > 0 && (
              <div className="mt-4 rounded-[1rem] border border-red-100 bg-red-50 p-4">
                {compilation.errors.map((error) => (
                  <p key={error} className="text-sm font-black text-red-700">
                    {error}
                  </p>
                ))}
              </div>
            )}

            {compilation.warnings.length > 0 && (
              <div className="mt-4 rounded-[1rem] border border-amber-100 bg-amber-50 p-4">
                {compilation.warnings.map((warning) => (
                  <p key={warning} className="text-sm font-bold text-amber-700">
                    {warning}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[1.6rem] border border-[rgba(225,230,246,0.95)] bg-white p-5 shadow-sm">
            <div className="text-base font-black text-[var(--alu-text)]">
              المقاسات الفعلية للوحدات
            </div>
            <div className="mt-4 space-y-3">
              {compilation.modulesPreview.map((module) => (
                <div
                  key={module.id}
                  className="rounded-[1rem] border border-[rgba(225,230,246,0.95)] bg-[#f8faff] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-[var(--alu-text)]">
                        {module.label}
                      </div>
                      <div className="mt-1 text-xs font-bold text-[var(--alu-text-soft)]">
                        {module.profile?.name || 'بدون نظام'} ·{' '}
                        {module.type === 'fixed' ? 'ثابت' : 'متحرك'}
                      </div>
                    </div>
                    <div className="rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-black text-[#5568ff]">
                      {module.w.toFixed(3)} × {module.h.toFixed(3)} م
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() =>
              onInsert(
                compilation.pieces,
                compilation.glass,
                compilation.accessories,
                compilation.operations
              )
            }
            disabled={compilation.errors.length > 0}
            className="flex w-full items-center justify-center gap-3 rounded-[1.35rem] bg-[var(--alu-accent)] px-5 py-4 text-base font-black text-white shadow-[0_20px_36px_rgba(85,104,255,0.24)] transition-all hover:bg-[#485cf6] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
          >
            <Save size={20} />
            إدراج التجميعة إلى أمر الإنتاج
          </button>
        </div>
      </div>
    </div>
  )
}

export default SmartAssemblyBuilder
