import { useMemo } from 'react'
import { AlertCircle, Boxes, FolderOpen, ShoppingCart } from 'lucide-react'

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })} ر.س`

const categoryMeta = {
  aluminum: {
    title: 'نواقص الألمنيوم',
    tone: 'border-sky-200 bg-sky-50 text-sky-700'
  },
  glass: {
    title: 'نواقص الزجاج',
    tone: 'border-cyan-200 bg-cyan-50 text-cyan-700'
  },
  accessories: {
    title: 'نواقص الإكسسوارات',
    tone: 'border-amber-200 bg-amber-50 text-amber-700'
  }
}

const normalizeRows = (record, key) => {
  const rows = record?.materialFlow?.purchase?.[key] || []

  return rows.map((row) => {
    const quantityLabel =
      key === 'glass'
        ? `${Number(row.shortageQty || 0).toLocaleString()} قطعة / ${Number(
            row.shortageArea || 0
          ).toLocaleString()} م²`
        : `${Number(row.shortageQty || 0).toLocaleString()}`

    const neededLabel =
      key === 'glass'
        ? `${Number(row.requiredQty || 0).toLocaleString()} قطعة`
        : `${Number(row.requiredQty || 0).toLocaleString()}`

    const availableLabel =
      key === 'glass'
        ? `${Number(row.consumedQty || 0).toLocaleString()} مغطاة`
        : `${Number(row.availableQty || 0).toLocaleString()} بالمخزون`

    const estimatedCost =
      key === 'glass'
        ? Number(row.shortageArea || 0) * (Number(row.pricePerUnit) || 0)
        : Number(row.shortageQty || 0) * (Number(row.pricePerUnit) || 0)

    return {
      id: `${record.id}-${key}-${row.inventoryId || row.itemName}`,
      contractId: record.id,
      clientName: record.info?.clientName || 'ملف بدون اسم',
      statusLabel: record.info?.executionStatusLabel || 'تحت التنفيذ',
      itemName: row.itemName || 'صنف غير محدد',
      quantityLabel,
      neededLabel,
      availableLabel,
      estimatedCost
    }
  })
}

const ProcurementWorkspace = ({ records, liveShortages = null, onOpenRecord, onOpenLiveOrder }) => {
  const sections = useMemo(() => {
    const sourceRecords = Array.isArray(records) ? records : []

    return Object.keys(categoryMeta).map((key) => {
      const rows = sourceRecords.flatMap((record) => normalizeRows(record, key))

      return {
        id: key,
        ...categoryMeta[key],
        rows,
        linesCount: rows.length,
        estimatedCost: rows.reduce((sum, row) => sum + row.estimatedCost, 0)
      }
    })
  }, [records])

  const totalLines = sections.reduce((sum, section) => sum + section.linesCount, 0)
  const totalEstimatedCost = sections.reduce((sum, section) => sum + section.estimatedCost, 0)

  return (
    <div className="space-y-5">
      {liveShortages?.hasShortages && (
        <div className="alu-panel rounded-[1.6rem] border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-amber-800">
                <AlertCircle size={16} />
                النواقص الحالية في أمر الإنتاج المفتوح
              </div>
              <p className="mt-2 text-[13px] font-bold leading-6 text-amber-900">
                يوجد نقص فعلي في الملف المفتوح الآن. يمكنك فتح أمر الإنتاج مباشرة لمراجعته أو تركه
                محفوظًا ليظهر هنا ضمن مركز المشتريات بشكل دائم.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenLiveOrder}
              className="rounded-[1rem] border border-amber-300 bg-white px-4 py-3 text-sm font-black text-amber-800 transition-colors hover:bg-amber-100"
            >
              فتح أمر الإنتاج الحالي
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="alu-panel rounded-[1.4rem] p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-black text-[var(--alu-text-soft)]">
            <ShoppingCart size={14} />
            سطور طلب شراء مفتوحة
          </div>
          <div className="text-xl font-black text-[var(--alu-text)]">
            {totalLines.toLocaleString()}
          </div>
        </div>

        <div className="alu-panel rounded-[1.4rem] p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-black text-[var(--alu-text-soft)]">
            <Boxes size={14} />
            عقود تحتاج خامات
          </div>
          <div className="text-xl font-black text-[var(--alu-text)]">
            {records.length.toLocaleString()}
          </div>
        </div>

        <div className="alu-panel rounded-[1.4rem] p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-black text-[var(--alu-text-soft)]">
            <AlertCircle size={14} />
            قيمة تقديرية للنواقص
          </div>
          <div className="text-xl font-black text-[var(--alu-text)]">
            {formatCurrency(totalEstimatedCost)}
          </div>
        </div>
      </div>

      {totalLines === 0 ? (
        <div className="rounded-[1.8rem] border border-dashed border-[var(--alu-border)] bg-white/80 px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.3rem] bg-[var(--alu-brand-soft)] text-[var(--alu-accent)]">
            <ShoppingCart size={28} />
          </div>
          <h3 className="mt-4 text-lg font-black text-[var(--alu-text)]">
            لا توجد نواقص شراء مفتوحة
          </h3>
          <p className="mt-2 text-sm font-bold text-[var(--alu-text-soft)]">
            عندما يكون المخزون غير كافٍ داخل العقود الجارية ستظهر هنا قائمة المواد المطلوبة للمورد.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {sections.map((section) => {
            if (!section.rows.length) return null

            return (
              <div key={section.id} className="alu-panel rounded-[1.7rem] p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black ${section.tone}`}
                    >
                      {section.title}
                    </div>
                    <h3 className="mt-3 text-lg font-black text-[var(--alu-text)]">
                      {section.rows.length.toLocaleString()} بند يحتاج استكمال
                    </h3>
                  </div>

                  <div className="rounded-[1rem] bg-[var(--alu-panel-soft)] px-4 py-3 text-sm font-black text-[var(--alu-text)]">
                    {formatCurrency(section.estimatedCost)}
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.2rem] border border-[var(--alu-border)]">
                  <table className="w-full text-right">
                    <thead className="bg-[var(--alu-panel-soft)] text-[11px] font-black text-[var(--alu-text-soft)]">
                      <tr>
                        <th className="px-4 py-3">العقد</th>
                        <th className="px-4 py-3">الصنف</th>
                        <th className="px-4 py-3 text-center">المطلوب</th>
                        <th className="px-4 py-3 text-center">المتوفر/المغطى</th>
                        <th className="px-4 py-3 text-center">العجز</th>
                        <th className="px-4 py-3 text-center">التكلفة</th>
                        <th className="px-4 py-3 text-center">فتح</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((row) => (
                        <tr key={row.id} className="border-t border-[var(--alu-border)] bg-white">
                          <td className="px-4 py-3">
                            <div className="font-black text-[var(--alu-text)]">
                              {row.clientName}
                            </div>
                            <div className="mt-1 text-[11px] font-bold text-[var(--alu-text-soft)]">
                              ملف رقم {row.contractId}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-[var(--alu-text)]">
                            {row.itemName}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-[var(--alu-text)]">
                            {row.neededLabel}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-emerald-700">
                            {row.availableLabel}
                          </td>
                          <td className="px-4 py-3 text-center font-black text-amber-700">
                            {row.quantityLabel}
                          </td>
                          <td className="px-4 py-3 text-center font-black text-[var(--alu-text)]">
                            {formatCurrency(row.estimatedCost)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => onOpenRecord(row.contractId)}
                              className="rounded-[0.9rem] bg-[var(--alu-brand-soft)] px-3 py-2 text-[12px] font-black text-[var(--alu-accent)] transition-colors hover:bg-[#e6ebff]"
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <FolderOpen size={14} />
                                الملف
                              </span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ProcurementWorkspace
