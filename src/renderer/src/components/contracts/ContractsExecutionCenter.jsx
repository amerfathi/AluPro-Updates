import { useMemo, useState } from 'react'
import {
  Archive,
  Boxes,
  CheckCircle2,
  Clock3,
  FolderOpen,
  Hammer,
  History,
  Milestone,
  ReceiptText,
  RotateCcw,
  ShoppingCart,
  Trash2,
  Wallet
} from 'lucide-react'
import {
  buildContractsExecutionModel,
  contractExecutionStatusMeta,
  projectRecordTypeMeta
} from '../../utils/contracts.js'

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })} ر.س`

const summaryCards = (summary) => [
  {
    key: 'active',
    title: 'عقود تحت التشغيل',
    value: summary.activeContractsCount.toLocaleString(),
    helper: 'ملفات تنفيذ جارية حاليًا',
    icon: Clock3,
    tone: 'from-sky-500/15 to-cyan-500/10 text-sky-700'
  },
  {
    key: 'completed',
    title: 'عقود مكتملة',
    value: summary.completedContractsCount.toLocaleString(),
    helper: 'محفوظة بكامل بياناتها',
    icon: Archive,
    tone: 'from-violet-500/15 to-fuchsia-500/10 text-violet-700'
  },
  {
    key: 'value',
    title: 'قيمة العقود الجارية',
    value: formatCurrency(summary.activeContractValue),
    helper: 'إجمالي العقود قيد التنفيذ',
    icon: ReceiptText,
    tone: 'from-emerald-500/15 to-teal-500/10 text-emerald-700'
  },
  {
    key: 'balance',
    title: 'المتبقي للتحصيل',
    value: formatCurrency(summary.activeRemainingTotal),
    helper: `يوجد ${summary.openShortageContracts.toLocaleString()} عقد به نواقص مفتوحة`,
    icon: Wallet,
    tone: 'from-amber-500/15 to-orange-500/10 text-amber-700'
  }
]

const viewOptions = [
  { id: 'all', label: 'عرض الكل' },
  { id: 'active', label: 'تحت التشغيل' },
  { id: 'completed', label: 'المكتملة' },
  { id: 'support', label: 'المقايسات الحرة' }
]

const StatusPill = ({ label, tone }) => (
  <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${tone}`}>{label}</span>
)

const ProgressBar = ({ label, value, tone = 'bg-[var(--alu-primary)]' }) => (
  <div className="rounded-[1.2rem] border border-[var(--alu-line)] bg-white px-4 py-3">
    <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black text-[var(--alu-text-soft)]">
      <span>{label}</span>
      <span className="text-[var(--alu-text)]">{value}%</span>
    </div>
    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--alu-panel-soft)]">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
    </div>
  </div>
)

const Metric = ({ icon: Icon, label, value, tone = 'text-[var(--alu-text)]' }) => (
  <div className="rounded-[1.2rem] border border-[var(--alu-line)] bg-[var(--alu-panel-soft)] px-4 py-3">
    <div className="mb-2 flex items-center gap-2 text-xs font-black text-[var(--alu-text-soft)]">
      <Icon size={14} />
      {label}
    </div>
    <div className={`text-sm font-black ${tone}`}>{value}</div>
  </div>
)

const SectionHeader = ({ title, subtitle, count }) => (
  <div className="mb-5 flex items-end justify-between gap-4">
    <div>
      <h3 className="text-xl font-black text-[var(--alu-text)]">{title}</h3>
      <p className="mt-1 text-sm font-bold text-[var(--alu-text-soft)]">{subtitle}</p>
    </div>
    <div className="rounded-full bg-[var(--alu-panel-soft)] px-4 py-2 text-xs font-black text-[var(--alu-text)]">
      {count.toLocaleString()} سجل
    </div>
  </div>
)

const EmptyState = ({ title, subtitle }) => (
  <div className="rounded-[1.8rem] border border-dashed border-[var(--alu-line)] bg-white/70 px-6 py-14 text-center">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[var(--alu-panel-soft)] text-[var(--alu-primary)]">
      <Archive size={28} />
    </div>
    <h4 className="text-lg font-black text-[var(--alu-text)]">{title}</h4>
    <p className="mt-2 text-sm font-bold text-[var(--alu-text-soft)]">{subtitle}</p>
  </div>
)

const TimelineItem = ({ item, isLast }) => {
  const stateStyles = {
    complete: 'border-emerald-200 bg-emerald-500 text-white',
    current: 'border-sky-200 bg-sky-500 text-white',
    pending: 'border-[var(--alu-line)] bg-white text-[var(--alu-text-soft)]'
  }

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-black ${stateStyles[item.state]}`}
        >
          {item.state === 'complete' ? '✓' : item.state === 'current' ? '•' : ''}
        </div>
        {!isLast && <div className="mt-1 h-full w-px bg-[var(--alu-line)]" />}
      </div>
      <div className="pb-5">
        <div className="text-sm font-black text-[var(--alu-text)]">{item.label}</div>
        <div className="mt-1 text-xs font-bold text-[var(--alu-text-soft)]">{item.helper}</div>
        {item.date && (
          <div className="mt-1 text-[11px] font-bold text-[var(--alu-primary)]">{item.date}</div>
        )}
      </div>
    </div>
  )
}

const ContractCard = ({
  contract,
  onReview,
  onDelete,
  onMarkContractReady,
  onReturnContractToProduction,
  onMarkCompleted,
  onReopenContract
}) => {
  const statusMeta = contractExecutionStatusMeta[contract.executionStatus]
  const typeMeta = projectRecordTypeMeta.contract

  return (
    <div className="alu-panel rounded-[1.9rem] p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={typeMeta.label} tone={typeMeta.tone} />
            <StatusPill label={statusMeta.label} tone={statusMeta.tone} />
          </div>
          <h4 className="text-xl font-black text-[var(--alu-text)]">
            {contract.info?.clientName || 'عقد بدون اسم عميل'}
          </h4>
          <div className="text-sm font-bold text-[var(--alu-text-soft)]">
            رقم العقد: {contract.id || 'غير محدد'} | تاريخ الملف:{' '}
            {contract.info?.date || 'غير محدد'}
          </div>
        </div>

        <div className="rounded-[1.2rem] border border-[var(--alu-line)] bg-[var(--alu-panel-soft)] px-4 py-3 text-left">
          <div className="text-[11px] font-black text-[var(--alu-text-soft)]">آخر نشاط</div>
          <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
            {contract.lastActivityLabel}
          </div>
          {contract.completedAt && (
            <div className="mt-2 text-xs font-bold text-violet-700">
              أُغلق بتاريخ {contract.completedAt}
            </div>
          )}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={ReceiptText}
          label="قيمة العقد"
          value={formatCurrency(contract.metrics.contractValue)}
        />
        <Metric icon={Wallet} label="المدفوع" value={formatCurrency(contract.metrics.paidAmount)} />
        <Metric
          icon={Wallet}
          label="المتبقي"
          value={formatCurrency(contract.metrics.remainingAmount)}
          tone={contract.metrics.remainingAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}
        />
        <Metric
          icon={Hammer}
          label="التكلفة الداخلية"
          value={formatCurrency(contract.metrics.internalCost)}
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ProgressBar
          label={`التقدم التنفيذي · ${contract.progressLabel}`}
          value={contract.metrics.progressPercent}
          tone="bg-gradient-to-r from-sky-500 to-cyan-500"
        />
        <ProgressBar
          label="نسبة التحصيل"
          value={contract.metrics.collectionPercent}
          tone="bg-gradient-to-r from-emerald-500 to-teal-500"
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Metric
          icon={ShoppingCart}
          label="بنود النواقص"
          value={`${contract.metrics.shortageLines.toLocaleString()} بند`}
          tone={contract.metrics.shortageLines > 0 ? 'text-amber-700' : 'text-emerald-700'}
        />
        <Metric
          icon={Boxes}
          label="مواد مصروفة"
          value={`${contract.metrics.consumedMaterialLines.toLocaleString()} بند`}
        />
        <Metric
          icon={Hammer}
          label="عمليات الورشة"
          value={`${contract.metrics.operationsCount.toLocaleString()} عملية`}
        />
      </div>

      {contract.metrics.shortageLines > 0 && (
        <div className="mb-5 rounded-[1.3rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          يوجد {contract.metrics.shortageLines.toLocaleString()} بند غير مغطى من المخزون، بقيمة
          تقديرية {formatCurrency(contract.metrics.shortageValue)}.
        </div>
      )}

      <div className="mb-5 rounded-[1.5rem] border border-[var(--alu-line)] bg-white px-5 py-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-black text-[var(--alu-text)]">
          <Milestone size={16} className="text-[var(--alu-primary)]" />
          الخط الزمني للعقد
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {contract.timeline.map((item, index) => (
            <TimelineItem
              key={item.id}
              item={item}
              isLast={index === contract.timeline.length - 1}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onReview(contract)}
          className="flex-1 rounded-[1.1rem] bg-[var(--alu-panel-soft)] px-4 py-3 text-sm font-black text-[var(--alu-primary)] transition-colors hover:bg-[#e9efff]"
        >
          <span className="inline-flex items-center gap-2">
            <FolderOpen size={16} /> فتح الملف
          </span>
        </button>

        {contract.executionStatus === 'completed' ? (
          <button
            onClick={() => onReopenContract(contract.id)}
            className="rounded-[1.1rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-700 transition-colors hover:bg-sky-100"
          >
            <span className="inline-flex items-center gap-2">
              <RotateCcw size={16} /> إعادة للتشغيل
            </span>
          </button>
        ) : contract.executionStatus === 'ready_installation' ? (
          <>
            <button
              onClick={() => onReturnContractToProduction(contract.id)}
              className="rounded-[1.1rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-700 transition-colors hover:bg-sky-100"
            >
              <span className="inline-flex items-center gap-2">
                <RotateCcw size={16} /> إعادة لقيد التنفيذ
              </span>
            </button>
            <button
              onClick={() => onMarkCompleted(contract.id)}
              className="rounded-[1.1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} /> نقل إلى المكتملة
              </span>
            </button>
          </>
        ) : contract.executionStatus === 'in_progress' ? (
          <>
            {contract.metrics.shortageLines === 0 && (
              <button
                onClick={() => onMarkContractReady(contract.id)}
                className="rounded-[1.1rem] border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-700 transition-colors hover:bg-violet-100"
              >
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} /> جاهز للتسليم
                </span>
              </button>
            )}
            <button
              onClick={() => onMarkCompleted(contract.id)}
              className="rounded-[1.1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} /> نقل إلى المكتملة
              </span>
            </button>
          </>
        ) : contract.executionStatus === 'awaiting_material' ? (
          <div className="rounded-[1.1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700">
            <span className="inline-flex items-center gap-2">
              <ShoppingCart size={16} /> بانتظار استكمال الخامات قبل التقدم للمرحلة التالية
            </span>
          </div>
        ) : (
          <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
            <span className="inline-flex items-center gap-2">
              <Clock3 size={16} /> يبدأ التتبع التنفيذي بعد توليد بيانات الإنتاج وربطها بالعقد
            </span>
          </div>
        )}

        <button
          onClick={() => onDelete(contract.id)}
          className="rounded-[1.1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition-colors hover:bg-red-100"
        >
          <span className="inline-flex items-center gap-2">
            <Trash2 size={16} /> حذف
          </span>
        </button>
      </div>
    </div>
  )
}

const SupportRecordCard = ({ record, onReview, onDelete }) => {
  const typeMeta = projectRecordTypeMeta[record.recordType]

  return (
    <div className="alu-panel rounded-[1.8rem] p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <StatusPill label={typeMeta.label} tone={typeMeta.tone} />
          <h4 className="mt-3 text-lg font-black text-[var(--alu-text)]">
            {record.info?.clientName || 'ملف بدون اسم'}
          </h4>
          <div className="mt-1 text-sm font-bold text-[var(--alu-text-soft)]">
            رقم الملف: {record.id || 'غير محدد'} | التاريخ: {record.info?.date || 'غير محدد'}
          </div>
        </div>

        <div className="text-sm font-bold text-[var(--alu-text-soft)]">
          {record.lastActivityLabel}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <Metric
          icon={Boxes}
          label="قطع ألمنيوم"
          value={`${record.metrics.piecesCount.toLocaleString()} قطعة`}
        />
        <Metric
          icon={Hammer}
          label="عمليات"
          value={`${record.metrics.operationsCount.toLocaleString()} عملية`}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onReview(record)}
          className="flex-1 rounded-[1.1rem] bg-[var(--alu-panel-soft)] px-4 py-3 text-sm font-black text-[var(--alu-primary)] transition-colors hover:bg-[#e9efff]"
        >
          <span className="inline-flex items-center gap-2">
            <FolderOpen size={16} /> فتح الملف
          </span>
        </button>
        <button
          onClick={() => onDelete(record.id)}
          className="rounded-[1.1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition-colors hover:bg-red-100"
        >
          <span className="inline-flex items-center gap-2">
            <Trash2 size={16} /> حذف
          </span>
        </button>
      </div>
    </div>
  )
}

const ContractsExecutionCenter = ({
  savedProjects,
  onReviewProject,
  onDeleteProject,
  onMarkContractReady,
  onReturnContractToProduction,
  onMarkContractCompleted,
  onReopenContract
}) => {
  const [activeView, setActiveView] = useState('all')
  const model = useMemo(() => buildContractsExecutionModel(savedProjects), [savedProjects])
  const cards = summaryCards(model.summary)

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--alu-panel-soft)] px-4 py-2 text-xs font-black text-[var(--alu-primary)]">
            <History size={14} /> مركز العقود والتنفيذ
          </div>
          <h2 className="text-3xl font-black text-[var(--alu-text)]">إدارة العقود بدل الأرشيف</h2>
          <p className="mt-2 max-w-3xl text-sm font-bold text-[var(--alu-text-soft)]">
            هنا تظهر العقود الجارية والمكتملة بشكل منفصل، بينما تبقى المقايسات الحرة والأوامر
            الداخلية في مساحة مستقلة حتى لا تختلط بدورة التعاقد والتنفيذ.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {viewOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveView(option.id)}
              className={`rounded-full px-4 py-2 text-sm font-black transition-all ${
                activeView === option.id
                  ? 'bg-[var(--alu-primary)] text-white shadow-sm'
                  : 'bg-[var(--alu-panel-soft)] text-[var(--alu-text-soft)] hover:text-[var(--alu-text)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.key}
              className={`overflow-hidden rounded-[1.8rem] border border-white/70 bg-gradient-to-br ${card.tone} p-5 shadow-sm`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-[1rem] bg-white/80 p-3">
                  <Icon size={18} />
                </div>
              </div>
              <div className="text-sm font-black">{card.title}</div>
              <div className="mt-3 text-2xl font-black">{card.value}</div>
              <div className="mt-2 text-xs font-bold opacity-75">{card.helper}</div>
            </div>
          )
        })}
      </div>

      {(activeView === 'all' || activeView === 'active') && (
        <section className="space-y-5">
          <SectionHeader
            title="عقود تحت التشغيل"
            subtitle="العقود التي ما زالت في دورة التنفيذ أو بانتظار استكمال خامات أو توريد."
            count={model.activeContracts.length}
          />

          {model.activeContracts.length === 0 ? (
            <EmptyState
              title="لا توجد عقود جارية حاليًا"
              subtitle="أي عقد جديد يتم ربطه بالإنتاج سيظهر هنا إلى أن يتم إغلاقه كمكتمل."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
              {model.activeContracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  onReview={onReviewProject}
                  onDelete={onDeleteProject}
                  onMarkContractReady={onMarkContractReady}
                  onReturnContractToProduction={onReturnContractToProduction}
                  onMarkCompleted={onMarkContractCompleted}
                  onReopenContract={onReopenContract}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {(activeView === 'all' || activeView === 'completed') && (
        <section className="space-y-5">
          <SectionHeader
            title="عقود مكتملة"
            subtitle="سجل العقود المنتهية والمحفوظة بكامل بياناتها المالية والمواد والتكلفة."
            count={model.completedContracts.length}
          />

          {model.completedContracts.length === 0 ? (
            <EmptyState
              title="لا توجد عقود مكتملة بعد"
              subtitle="عندما تُغلق عقدًا مكتملًا سيبقى محفوظًا هنا مع كل بياناته للرجوع إليه."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
              {model.completedContracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  onReview={onReviewProject}
                  onDelete={onDeleteProject}
                  onMarkContractReady={onMarkContractReady}
                  onReturnContractToProduction={onReturnContractToProduction}
                  onMarkCompleted={onMarkContractCompleted}
                  onReopenContract={onReopenContract}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {(activeView === 'all' || activeView === 'support') && (
        <section className="space-y-5">
          <SectionHeader
            title="المقايسات الحرة والأوامر الداخلية"
            subtitle="ملفات مساندة لا يجب أن تختلط مع العقود الجارية أو المكتملة."
            count={model.supportRecords.length}
          />

          {model.supportRecords.length === 0 ? (
            <EmptyState
              title="لا توجد ملفات مساندة محفوظة"
              subtitle="أي مقايسة حرة أو أمر داخلي محفوظ سيظهر هنا بعيدًا عن دورة العقود."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
              {model.supportRecords.map((record) => (
                <SupportRecordCard
                  key={record.id}
                  record={record}
                  onReview={onReviewProject}
                  onDelete={onDeleteProject}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default ContractsExecutionCenter
