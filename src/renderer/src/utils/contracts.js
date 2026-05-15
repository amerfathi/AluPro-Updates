import { parseArabicNum } from './number.js'
import { isContractProject } from './productionFlow.js'

const roundCurrency = (value) => Number((Number(value) || 0).toFixed(2))

const activeContractStatuses = ['draft', 'awaiting_material', 'in_progress', 'ready_installation']

export const contractExecutionStatusMeta = {
  draft: {
    label: 'مسودة',
    tone: 'border-slate-200 bg-slate-100 text-slate-700'
  },
  awaiting_material: {
    label: 'بانتظار خامات',
    tone: 'border-amber-200 bg-amber-50 text-amber-700'
  },
  in_progress: {
    label: 'تحت التشغيل',
    tone: 'border-sky-200 bg-sky-50 text-sky-700'
  },
  ready_installation: {
    label: 'جاهز للتسليم',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700'
  },
  completed: {
    label: 'مكتمل',
    tone: 'border-violet-200 bg-violet-50 text-violet-700'
  }
}

export const projectRecordTypeMeta = {
  contract: {
    label: 'عقد عميل',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700'
  },
  measurement: {
    label: 'مقايسة حرة',
    tone: 'border-slate-200 bg-slate-100 text-slate-700'
  },
  internal_order: {
    label: 'أمر إنتاج داخلي',
    tone: 'border-indigo-200 bg-indigo-50 text-indigo-700'
  }
}

export const executionProgressMap = {
  draft: 20,
  awaiting_material: 38,
  in_progress: 68,
  ready_installation: 88,
  completed: 100
}

const executionStageMeta = [
  {
    id: 'contract',
    label: 'اعتماد العقد',
    helper: 'بيانات العقد والمقاسات الأساسية'
  },
  {
    id: 'materials',
    label: 'تأمين الخامات',
    helper: 'المخزون والنواقص وأوامر التوريد'
  },
  {
    id: 'production',
    label: 'القص والتجميع',
    helper: 'الورشة والعمليات الداخلية'
  },
  {
    id: 'handoff',
    label: 'التسليم والإغلاق',
    helper: 'إقفال الملف وحفظه كمكتمل'
  }
]

const getProjectWorkflowMode = (project) =>
  project?.workflowMode || project?.info?.workflowMode || ''

export const getSavedProjectRecordType = (project) => {
  if (isContractProject(project)) return 'contract'

  const workflowMode = getProjectWorkflowMode(project)
  if (workflowMode === 'measurement') return 'measurement'

  return 'internal_order'
}

export const countPurchaseShortageLines = (projectOrFlow) => {
  const purchase = projectOrFlow?.materialFlow?.purchase || projectOrFlow?.purchase
  if (!purchase) return 0

  return ['aluminum', 'glass', 'accessories'].reduce(
    (sum, key) => sum + (Array.isArray(purchase[key]) ? purchase[key].length : 0),
    0
  )
}

const countConsumedMaterialLines = (project) =>
  ['aluminum', 'glass', 'accessories'].reduce((sum, key) => {
    const rows = Array.isArray(project?.materialFlow?.[key]) ? project.materialFlow[key] : []
    return (
      sum +
      rows.filter((item) => Number(item.consumedQty) > 0 || Number(item.consumedArea) > 0).length
    )
  }, 0)

const getOperationsCost = (project) =>
  roundCurrency(
    (project?.operations || []).reduce((sum, operation) => {
      const explicitTotal = Number(operation?.totalCost)
      if (!Number.isNaN(explicitTotal) && explicitTotal > 0) return sum + explicitTotal

      return (
        sum + (Number(operation?.quantity) || 0) * (parseArabicNum(operation?.costPerUnit) || 0)
      )
    }, 0)
  )

export const deriveContractExecutionStatus = (project) => {
  const recordType = getSavedProjectRecordType(project)
  if (recordType !== 'contract') return ''

  const explicitStatus = project?.info?.executionStatus || project?.executionStatus
  if (explicitStatus && contractExecutionStatusMeta[explicitStatus]) return explicitStatus

  if (project?.info?.completedAt || project?.completedAt) return 'completed'

  const shortageLines = countPurchaseShortageLines(project)
  if (shortageLines > 0) return 'awaiting_material'

  const hasProductionData =
    (project?.pieces?.length || 0) +
      (project?.accessories?.length || 0) +
      (project?.glass?.length || 0) +
      (project?.operations?.length || 0) >
    0

  return hasProductionData ? 'in_progress' : 'draft'
}

export const buildContractLifecycleForSave = ({
  projectInfo,
  workflowMode,
  materialFlowSnapshot,
  pieces,
  accessories,
  glass,
  operations,
  existingProject,
  localeDate = new Date().toLocaleDateString()
}) => {
  if (workflowMode !== 'contract') {
    return {
      executionStatus: '',
      completedAt: '',
      statusChangedAt: ''
    }
  }

  const currentStatus = projectInfo?.executionStatus || existingProject?.info?.executionStatus || ''
  const isCompleted = currentStatus === 'completed'
  const shortageLines = countPurchaseShortageLines(materialFlowSnapshot)
  const hasProductionData =
    (pieces?.length || 0) +
      (accessories?.length || 0) +
      (glass?.length || 0) +
      (operations?.length || 0) >
    0

  const executionStatus = isCompleted
    ? 'completed'
    : shortageLines > 0
      ? 'awaiting_material'
      : currentStatus === 'ready_installation'
        ? 'ready_installation'
        : hasProductionData
          ? 'in_progress'
          : 'draft'

  return {
    executionStatus,
    completedAt:
      executionStatus === 'completed'
        ? projectInfo?.completedAt || existingProject?.info?.completedAt || localeDate
        : '',
    statusChangedAt: new Date().toISOString()
  }
}

const buildExecutionTimeline = ({ executionStatus, info, updatedAt }) => {
  const statusStageMap = {
    draft: ['contract'],
    awaiting_material: ['contract'],
    in_progress: ['contract', 'materials'],
    ready_installation: ['contract', 'materials', 'production'],
    completed: ['contract', 'materials', 'production', 'handoff']
  }

  const currentStageMap = {
    draft: 'materials',
    awaiting_material: 'materials',
    in_progress: 'production',
    ready_installation: 'handoff',
    completed: 'handoff'
  }

  const completedStages = statusStageMap[executionStatus] || ['contract']
  const currentStage = currentStageMap[executionStatus] || 'materials'

  return executionStageMeta.map((stage) => ({
    ...stage,
    state: completedStages.includes(stage.id)
      ? 'complete'
      : stage.id === currentStage
        ? 'current'
        : 'pending',
    date:
      stage.id === 'contract'
        ? info?.date || ''
        : stage.id === 'handoff'
          ? info?.completedAt || ''
          : info?.statusChangedAt || updatedAt || ''
  }))
}

export const buildContractExecutionSnapshot = (project) => {
  const recordType = getSavedProjectRecordType(project)
  const executionStatus = deriveContractExecutionStatus(project)
  const internalCost = roundCurrency(project?.totalCost || 0)
  const contractValue = roundCurrency(project?.contractValue || 0)
  const paidAmount = roundCurrency(project?.paidAmount || 0)
  const remainingAmount = roundCurrency(contractValue - paidAmount)
  const shortageLines = countPurchaseShortageLines(project)
  const shortageValue = roundCurrency(project?.materialFlow?.totals?.shortageValue || 0)
  const consumedValue = roundCurrency(project?.materialFlow?.totals?.consumedValue || 0)
  const operationsCost = getOperationsCost(project)
  const piecesCount = (project?.pieces || []).length
  const accessoriesCount = (project?.accessories || []).length
  const glassCount = (project?.glass || []).length
  const operationsCount = (project?.operations || []).length
  const collectionPercent =
    contractValue > 0 ? Math.min(100, Math.round((paidAmount / contractValue) * 100)) : 0
  const progressPercent = executionProgressMap[executionStatus] || 0
  const progressLabel = contractExecutionStatusMeta[executionStatus]?.label || 'غير محدد'

  return {
    ...project,
    recordType,
    executionStatus,
    executionBucket:
      recordType === 'contract' && activeContractStatuses.includes(executionStatus)
        ? 'active'
        : executionStatus === 'completed'
          ? 'completed'
          : 'other',
    metrics: {
      contractValue,
      paidAmount,
      remainingAmount,
      internalCost,
      shortageLines,
      shortageValue,
      consumedValue,
      operationsCost,
      piecesCount,
      accessoriesCount,
      glassCount,
      operationsCount,
      consumedMaterialLines: countConsumedMaterialLines(project),
      progressPercent,
      collectionPercent
    },
    progressLabel,
    lastActivityLabel: project?.updatedAt
      ? new Date(project.updatedAt).toLocaleString()
      : project?.info?.date || project?.date || 'غير محدد',
    completedAt: project?.info?.completedAt || project?.completedAt || '',
    sortKey: Date.parse(project?.updatedAt || '') || Number(project?.id) || 0,
    timeline: buildExecutionTimeline({
      executionStatus,
      info: project?.info,
      updatedAt: project?.updatedAt
    })
  }
}

export const buildContractsExecutionModel = (savedProjects = []) => {
  const rows = savedProjects.map(buildContractExecutionSnapshot)

  const sortRows = (items) => [...items].sort((a, b) => b.sortKey - a.sortKey)
  const contractRows = rows.filter((row) => row.recordType === 'contract')
  const activeContracts = sortRows(contractRows.filter((row) => row.executionBucket === 'active'))
  const completedContracts = sortRows(
    contractRows.filter((row) => row.executionStatus === 'completed')
  )
  const supportRecords = sortRows(rows.filter((row) => row.recordType !== 'contract'))

  const activeRemainingTotal = roundCurrency(
    activeContracts.reduce((sum, contract) => sum + contract.metrics.remainingAmount, 0)
  )
  const activeContractValue = roundCurrency(
    activeContracts.reduce((sum, contract) => sum + contract.metrics.contractValue, 0)
  )

  return {
    rows,
    activeContracts,
    completedContracts,
    supportRecords,
    summary: {
      activeContractsCount: activeContracts.length,
      completedContractsCount: completedContracts.length,
      supportRecordsCount: supportRecords.length,
      activeRemainingTotal,
      activeContractValue,
      openShortageContracts: activeContracts.filter(
        (contract) => contract.metrics.shortageLines > 0
      ).length
    }
  }
}
