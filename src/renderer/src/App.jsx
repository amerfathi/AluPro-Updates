import React, { useState, useMemo, useEffect } from 'react'
import VisualDesigner from './VisualDesigner.jsx'
import AppShell from './components/AppShell.jsx'
import SearchableDropdown from './components/SearchableDropdown.jsx'
import ProductionDashboard from './components/dashboard/ProductionDashboard.jsx'
import ProductionCuttingWorkspace from './components/production/ProductionCuttingWorkspace.jsx'
import ContractsExecutionCenter from './components/contracts/ContractsExecutionCenter.jsx'
import ProcurementWorkspace from './components/materials/ProcurementWorkspace.jsx'
import WorkspaceSectionShell from './components/workspace/WorkspaceSectionShell.jsx'
import { appNavigation, flatNavigationItems } from './config/navigation.js'
import { buildLicenseFeatureAccess } from './config/licenseFeatures.js'
import {
  createDefaultAccessory,
  createDefaultCompanySettings,
  createDefaultContractItem,
  createDefaultGlassFormula,
  createDefaultGlassPiece,
  createDefaultGlassRawSheet,
  createDefaultInventory,
  createDefaultInventoryItem,
  createDefaultPaymentDraft,
  createDefaultProfileFormData,
  createDefaultProfileFormula,
  createDefaultProfiles,
  createDefaultProjectInfo,
  createDefaultQuoteConfig,
  createDefaultQuoteItem,
  createDefaultQuoteItems,
  createDefaultTechnicalOperation,
  createDefaultWindowInput,
  createDefaultWindowSection
} from './data/defaults.js'
import { useAutoUpdater } from './hooks/useAutoUpdater.js'
import { useDeviceId } from './hooks/useDeviceId.js'
import { usePersistentState } from './hooks/usePersistentState.js'
import { getExtrusionType, groupIdenticalBars, optimizeCutting } from './utils/aluCalculations.js'
import { APP_VERSION } from './utils/license.js'
import { parseArabicNum } from './utils/number.js'
import {
  applyMaterialConsumptionToInventory,
  buildProductionNeedsModel,
  buildInventoryBaseline,
  buildMaterialFlowSnapshot,
  buildProjectLeftovers,
  hasProductionBatchItems,
  isContractProject,
  mergeProductionAccessories,
  mergeProductionGlass,
  mergeProductionOperations,
  mergeProductionPieces,
  normalizeProductionBatch
} from './utils/productionFlow.js'
import {
  buildContractExecutionSnapshot,
  buildContractLifecycleForSave,
  countPurchaseShortageLines,
  contractExecutionStatusMeta,
  deriveContractExecutionStatus,
  getSavedProjectRecordType
} from './utils/contracts.js'
import { buildLiveShortagesSummary, buildProductionOrderSnapshot } from './utils/productionOrder.js'
import {
  compileTechnicalSystemWindow,
  defaultTechnicalSystemPhysics,
  normalizeTechnicalSystem,
  technicalAccessoryCalcModes,
  technicalOperationCategories,
  validateTechnicalSystem
} from './utils/technicalSystem.js'
import { buildProfileSelectionPlan } from './domain/index.js'
import {
  Plus,
  Trash2,
  Printer,
  Save,
  Package,
  Scissors,
  Layout,
  X,
  Frame,
  Settings,
  AlertCircle,
  ListChecks,
  ShoppingCart,
  Layers,
  Building,
  Upload,
  Building2,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Palette,
  Archive,
  FileJson,
  CheckCircle,
  AppWindow,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Maximize,
  Copy,
  Boxes,
  Calculator,
  Download,
  PieChart
} from 'lucide-react'

const createTechnicalSystemSimulationInput = (systemType = 'sliding') => ({
  ...createDefaultWindowInput(),
  label: 'عنصر تجريبي',
  sections: [createDefaultWindowSection(1, systemType === 'fixed' ? 'fixed' : 'sash')]
})

const reportTimelineStateStyles = {
  complete: 'bg-emerald-500 border-emerald-200 text-white',
  current: 'bg-sky-500 border-sky-200 text-white',
  pending: 'bg-white border-[var(--alu-line)] text-[var(--alu-text-soft)]'
}

const TAB_FEATURE_MAP = {
  dashboard: 'dashboard',
  project: 'contracts',
  quotation: 'quotation',
  cutting: 'production',
  reports: 'reports',
  glass: 'glass',
  inventory: 'inventory',
  procurement: 'procurement',
  profiles: 'technical_catalog',
  settings: 'admin_settings',
  history: 'archive'
}

const HUB_FEATURE_MAP = {
  dashboard: ['dashboard'],
  contracts_hub: ['contracts', 'quotation'],
  production_hub: ['production', 'reports', 'glass'],
  materials_hub: ['inventory', 'procurement'],
  execution_hub: ['archive'],
  admin_hub: ['technical_catalog', 'admin_settings']
}

const ReportContractStatusPanel = ({ snapshot, compact = false, className = '' }) => {
  if (!snapshot) return null

  const statusMeta = contractExecutionStatusMeta[snapshot.executionStatus] || {
    label: 'غير محدد',
    tone: 'border-slate-200 bg-slate-100 text-slate-700'
  }

  if (compact) {
    return (
      <div
        className={`rounded-[1.4rem] border border-[var(--alu-line)] bg-[var(--alu-panel-soft)] px-5 py-4 ${className}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-black text-[var(--alu-text)]">حالة العقد الحالية</span>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusMeta.tone}`}>
              {statusMeta.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-black text-[var(--alu-text-soft)]">
            <span>التقدم التنفيذي: {snapshot.metrics.progressPercent}%</span>
            <span>التحصيل: {snapshot.metrics.collectionPercent}%</span>
            <span>بنود النواقص: {snapshot.metrics.shortageLines}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-[2rem] border border-[var(--alu-line)] bg-white p-6 shadow-sm ${className}`}
    >
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--alu-panel-soft)] px-4 py-2 text-xs font-black text-[var(--alu-primary)]">
            <PieChart size={14} /> حالة العقد داخل التقارير
          </div>
          <h3 className="text-xl font-black text-[var(--alu-text)]">
            {snapshot.info?.clientName || 'عقد بدون اسم'}
          </h3>
          <p className="mt-1 text-sm font-bold text-[var(--alu-text-soft)]">
            رقم العقد: {snapshot.id || 'غير مربوط'} | آخر تحديث: {snapshot.lastActivityLabel}
          </p>
        </div>

        <span className={`rounded-full border px-4 py-2 text-sm font-black ${statusMeta.tone}`}>
          {statusMeta.label}
        </span>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[1.3rem] border border-[var(--alu-line)] bg-[var(--alu-panel-soft)] px-4 py-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black text-[var(--alu-text-soft)]">
            <span>التقدم التنفيذي</span>
            <span className="text-[var(--alu-text)]">{snapshot.metrics.progressPercent}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500"
              style={{ width: `${snapshot.metrics.progressPercent}%` }}
            />
          </div>
        </div>
        <div className="rounded-[1.3rem] border border-[var(--alu-line)] bg-[var(--alu-panel-soft)] px-4 py-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black text-[var(--alu-text-soft)]">
            <span>نسبة التحصيل</span>
            <span className="text-[var(--alu-text)]">{snapshot.metrics.collectionPercent}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
              style={{ width: `${snapshot.metrics.collectionPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-[1.2rem] border border-[var(--alu-line)] bg-[var(--alu-panel-soft)] px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-black text-[var(--alu-text-soft)]">
            <Calculator size={14} />
            التكلفة الداخلية
          </div>
          <div className="text-sm font-black text-[var(--alu-text)]">
            {snapshot.metrics.internalCost.toLocaleString()} ر.س
          </div>
        </div>
        <div className="rounded-[1.2rem] border border-[var(--alu-line)] bg-[var(--alu-panel-soft)] px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-black text-[var(--alu-text-soft)]">
            <ShoppingCart size={14} />
            بنود النواقص
          </div>
          <div
            className={`text-sm font-black ${snapshot.metrics.shortageLines > 0 ? 'text-amber-700' : 'text-emerald-700'}`}
          >
            {snapshot.metrics.shortageLines} بند
          </div>
        </div>
        <div className="rounded-[1.2rem] border border-[var(--alu-line)] bg-[var(--alu-panel-soft)] px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-black text-[var(--alu-text-soft)]">
            <AlertCircle size={14} />
            الرصيد المتبقي
          </div>
          <div className="text-sm font-black text-[var(--alu-text)]">
            {snapshot.metrics.remainingAmount.toLocaleString()} ر.س
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.timeline.map((item) => (
          <div
            key={item.id}
            className="rounded-[1.2rem] border border-[var(--alu-line)] bg-[var(--alu-panel-soft)] px-4 py-3"
          >
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-black ${reportTimelineStateStyles[item.state]}`}
              >
                {item.state === 'complete' ? '✓' : item.state === 'current' ? '•' : ''}
              </div>
              <div>
                <div className="text-sm font-black text-[var(--alu-text)]">{item.label}</div>
                <div className="text-[11px] font-bold text-[var(--alu-text-soft)]">
                  {item.helper}
                </div>
              </div>
            </div>
            {item.date && (
              <div className="text-[11px] font-black text-[var(--alu-primary)]">{item.date}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ========================================================
// التطبيق الرئيسي
// ========================================================
const App = () => {
  const [isActivated, setIsActivated] = useState(false)
  const [isCheckingLicense, setIsCheckingLicense] = useState(true)
  const [licenseExpiryDate, setLicenseExpiryDate] = useState(null)
  const [licenseFeatures, setLicenseFeatures] = useState([])
  const [licensePlan, setLicensePlan] = useState('')
  const [licenseKey, setLicenseKey] = useState('')
  const [activationError, setActivationError] = useState('')
  const [isLoadingActivation, setIsLoadingActivation] = useState(false)
  const [systemMessage, setSystemMessage] = useState(null)

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  })
  const requestConfirm = (message, onConfirmCallback) => {
    setConfirmDialog({ isOpen: true, message, onConfirm: onConfirmCallback })
  }

  useEffect(() => {
    window.alert = (message) => {
      const isError =
        message?.includes('⚠️') || message?.includes('الرجاء') || message?.includes('خطأ')
      setSystemMessage({ text: message, type: isError ? 'error' : 'success' })
      setTimeout(() => setSystemMessage(null), 5000)
    }
  }, [])

  const {
    updateAvailable,
    downloadProgress,
    updateReady,
    isDownloading,
    updateError,
    startDownload,
    restartAndInstall
  } = useAutoUpdater()
  const deviceHWID = useDeviceId()
  const licenseAccess = useMemo(
    () => buildLicenseFeatureAccess(licenseFeatures),
    [licenseFeatures]
  )

  const isHubAllowed = (hubId) => {
    const requiredFeatures = HUB_FEATURE_MAP[hubId]
    if (!requiredFeatures || requiredFeatures.length === 0) return true
    return requiredFeatures.some((featureId) => licenseAccess.has(featureId))
  }

  const isTabAllowed = (tabId) => {
    const requiredFeature = TAB_FEATURE_MAP[tabId]
    if (!requiredFeature) return true
    return licenseAccess.has(requiredFeature)
  }

  const resolveFirstAllowedTab = () => {
    const fallbackOrder = [
      'dashboard',
      'project',
      'quotation',
      'cutting',
      'reports',
      'glass',
      'inventory',
      'procurement',
      'history',
      'profiles',
      'settings'
    ]

    return fallbackOrder.find((tabId) => isTabAllowed(tabId)) || 'dashboard'
  }

  const redirectToAllowedTab = (blockedTabLabel = 'هذه الشاشة') => {
    const fallbackTab = resolveFirstAllowedTab()
    setActiveTab(fallbackTab)
    setSystemMessage({
      text: `الميزة "${blockedTabLabel}" غير مفعلة في هذا الترخيص.`,
      type: 'error'
    })
  }

  useEffect(() => {
    let isMounted = true

    const loadLicenseStatus = async () => {
      try {
        const status = await window.electron.ipcRenderer.invoke('license:get_status')
        if (!isMounted) return

        const activated = Boolean(status?.isActivated)
        setIsActivated(activated)
        setLicenseExpiryDate(activated ? status?.expiryDate || null : null)
        setLicenseFeatures(activated ? status?.features || [] : [])
        setLicensePlan(activated ? status?.plan || '' : '')

        if (!activated && status?.reason === 'public_key_unavailable') {
          setActivationError('تعذر تحميل المفتاح العام للترخيص. راجع إعدادات الترخيص.')
        }
      } catch {
        if (!isMounted) return
        setIsActivated(false)
        setLicenseExpiryDate(null)
        setLicenseFeatures([])
        setLicensePlan('')
        setActivationError('تعذر التحقق من حالة الترخيص حالياً.')
      } finally {
        if (isMounted) {
          setIsCheckingLicense(false)
        }
      }
    }

    loadLicenseStatus()

    return () => {
      isMounted = false
    }
  }, [])

  const handleOfflineActivation = async () => {
    const normalizedToken = String(licenseKey || '').replace(/\s+/g, '').trim()

    if (!normalizedToken) {
      setActivationError('الرجاء إدخال كود التفعيل!')
      return
    }

    setIsLoadingActivation(true)
    setActivationError('')

    try {
      const response = await window.electron.ipcRenderer.invoke(
        'license:activate',
        normalizedToken
      )

      if (response?.ok && response?.status?.isActivated) {
        setIsActivated(true)
        setLicenseExpiryDate(response.status.expiryDate || null)
        setLicenseFeatures(response.status.features || [])
        setLicensePlan(response.status.plan || '')
        setLicenseKey('')
        alert(response?.message || 'تم التفعيل بنجاح.')
      } else {
        setIsActivated(false)
        setLicenseExpiryDate(null)
        setLicenseFeatures([])
        setLicensePlan('')
        setActivationError(response?.message || 'فشل التفعيل. يرجى التحقق من الكود.')
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'فشل استدعاء خدمة التفعيل من التطبيق الرئيسي.'
      setActivationError(`حدث خطأ أثناء التفعيل: ${errorMessage}`)
    } finally {
      setIsLoadingActivation(false)
    }
  }

  useEffect(() => {
    if (!isActivated) return
    setTimeout(() => {
      setSystemMessage({
        text: 'مرحباً بك في ألمنيوم برو (نسخة الإنتاج).',
        type: 'info'
      })
    }, 2000)
  }, [isActivated])

  const [activeTab, setActiveTab] = useState('dashboard')
  const [bladeThickness] = useState(3)

  useEffect(() => {
    if (activeTab === 'cutting-legacy') {
      setActiveTab('cutting')
    }
  }, [activeTab])

  useEffect(() => {
    if (isCheckingLicense || !isActivated) return
    if (isTabAllowed(activeTab)) return

    const fallbackTab = resolveFirstAllowedTab()
    if (fallbackTab !== activeTab) {
      setActiveTab(fallbackTab)
    }
  }, [activeTab, isActivated, isCheckingLicense, licenseAccess])

  const [companySettings, setCompanySettings] = usePersistentState(
    'aluManagerSettings',
    createDefaultCompanySettings
  )

  const [leftovers, setLeftovers] = usePersistentState('aluManagerLeftovers', [])

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCompanySettings((prev) => ({ ...prev, logo: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }
  const handleAppIconUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCompanySettings((prev) => ({ ...prev, appIcon: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const [masterInventory, setMasterInventory] = usePersistentState(
    'aluMasterInventory',
    createDefaultInventory
  )

  const [profiles, setProfiles] = usePersistentState('aluManagerProfilesBOM', createDefaultProfiles)

  const handleExportDatabase = () => {
    const dbData = { masterInventory: masterInventory, profiles: profiles }
    const blob = new Blob([JSON.stringify(dbData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `AluPro_Master_DB_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportDatabase = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result)
        if (json.masterInventory && json.profiles) {
          requestConfirm(
            '⚠️ تحذير خطير: سيتم مسح "المستودع المركزي" و "الكتالوج" الحاليين بالكامل واستبدالهما بالبيانات الجديدة. هل أنت متأكد؟',
            () => {
              setMasterInventory(json.masterInventory)
              setProfiles(json.profiles)
              alert('تم استيراد قاعدة البيانات بنجاح!')
            }
          )
        } else {
          alert('صيغة الملف غير صحيحة. يجب أن يكون الملف مصدّراً من برنامج ألمنيوم برو.')
        }
      } catch {
        alert('حدث خطأ أثناء قراءة الملف. تأكد أنه ملف JSON صالح.')
      }
    }
    reader.readAsText(file)
    e.target.value = null
  }

  const [projectInfo, setProjectInfo] = useState(createDefaultProjectInfo)

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [newPayment, setNewPayment] = useState(createDefaultPaymentDraft)

  const [quoteInnerTab, setQuoteInnerTab] = useState('editor')
  const defaultQuoteColumns = useMemo(() => createDefaultQuoteConfig().columns, [])
  const [quoteConfig, setQuoteConfig] = useState(createDefaultQuoteConfig)
  const [quoteItems, setQuoteItems] = useState(createDefaultQuoteItems)

  const [savedProjects, setSavedProjects] = usePersistentState('aluManagerProjects', [])

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState(null)
  const [profileModalTab, setProfileModalTab] = useState('basic')
  const [profileFormData, setProfileFormData] = useState(createDefaultProfileFormData)
  const [profileSimulationInput, setProfileSimulationInput] = useState(() =>
    createTechnicalSystemSimulationInput()
  )
  const profileFormValidation = useMemo(
    () => validateTechnicalSystem(profileFormData, masterInventory),
    [profileFormData, masterInventory]
  )
  const profileHealthMap = useMemo(
    () =>
      Object.fromEntries(
        profiles.map((profile) => [profile.id, validateTechnicalSystem(profile, masterInventory)])
      ),
    [profiles, masterInventory]
  )
  const profileSimulationResult = useMemo(
    () =>
      compileTechnicalSystemWindow({
        system: profileFormData,
        opening: profileSimulationInput
      }),
    [profileFormData, profileSimulationInput]
  )
  const profileSimulationBarSummary = useMemo(() => {
    const grouped = {}

    profileSimulationResult.pieces.forEach((piece) => {
      const key = piece.inventoryId || piece.label
      if (!grouped[key]) {
        const inventoryItem = masterInventory.find((item) => item.id === piece.inventoryId)
        grouped[key] = {
          itemName: inventoryItem?.name || piece.label,
          barLength: Number(inventoryItem?.length) || 5.8,
          pieces: []
        }
      }
      grouped[key].pieces.push(piece)
    })

    return Object.values(grouped).map((group) => ({
      itemName: group.itemName,
      barsCount: optimizeCutting(group.pieces, group.barLength, bladeThickness, 6.5).length
    }))
  }, [profileSimulationResult.pieces, masterInventory, bladeThickness])

  const [neededPieces, setNeededPieces] = useState([])
  const [neededAccessories, setNeededAccessories] = useState([])
  const [neededGlass, setNeededGlass] = useState([])
  const [neededOperations, setNeededOperations] = useState([])
  const [reportType, setReportType] = useState('bom_internal')
  const [inputMode, setInputMode] = useState('window')
  const [selectedTechProfile, setSelectedTechProfile] = useState('all')
  const [mainSystemId, setMainSystemId] = useState('')

  const [windowInput, setWindowInput] = useState(createDefaultWindowInput)

  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importedData, setImportedData] = useState([])
  const [importMapping, setImportMapping] = useState({})

  const [glassRawSheet, setGlassRawSheet] = useState(createDefaultGlassRawSheet)
  const [glassPiecesList, setGlassPiecesList] = useState([])
  const [currentGlassPiece, setCurrentGlassPiece] = useState(createDefaultGlassPiece)
  const [glassCutResults, setGlassCutResults] = useState(null)

  const [inventoryActiveTab, setInventoryActiveTab] = useState('aluminum')
  const [newInventoryItem, setNewInventoryItem] = useState(createDefaultInventoryItem)

  // ==========================================================
  // محرك النافذة الذكية (المعاينة المباشرة على الشاشة) 🚀
  // ==========================================================
  const previewPieces = useMemo(() => {
    const mainSystem = profiles.find((p) => String(p.id) === String(mainSystemId))
    if (!mainSystem) return []

    const compiled = compileTechnicalSystemWindow({
      system: mainSystem,
      opening: windowInput
    })

    return compiled.pieces.map((piece) => ({
      tempId: `${piece.inventoryId}-${piece.label}-${piece.length}`,
      label: piece.label,
      length: piece.length
    }))
  }, [windowInput, mainSystemId, profiles])

  const appendProductionBatch = (
    batch,
    {
      requirePieces = false,
      emptyAlert = '⚠️ لم تنتج العملية أي مواد فعلية. راجع الأنظمة الفنية وإدخال البيانات.'
    } = {}
  ) => {
    const normalizedBatch = normalizeProductionBatch(batch)
    if (requirePieces && normalizedBatch.pieces.length === 0) {
      alert(emptyAlert)
      return false
    }

    if (!hasProductionBatchItems(normalizedBatch)) {
      alert(emptyAlert)
      return false
    }

    setNeededPieces((prev) => mergeProductionPieces(prev, normalizedBatch.pieces))
    setNeededGlass((prev) => mergeProductionGlass(prev, normalizedBatch.glass))
    setNeededAccessories((prev) => mergeProductionAccessories(prev, normalizedBatch.accessories))
    setNeededOperations((prev) => mergeProductionOperations(prev, normalizedBatch.operations))
    return true
  }

  // ==========================================================
  // محرك إدراج النافذة المطور (دعم كامل للثابت والمنفصل) 📐
  // ==========================================================
  const addSmartWindow = () => {
    try {
      const compatibilityPlan = buildProfileSelectionPlan(profiles, windowInput)
      let runtimeSystemId = mainSystemId

      if (!runtimeSystemId) {
        const suggestedProfile = compatibilityPlan.eligible[0]
        if (!suggestedProfile) {
          return alert('⚠️ لا يوجد قطاع متوافق مع نوع العنصر الحالي. عدّل نوع العنصر أو نمط الفتح.')
        }
        runtimeSystemId = suggestedProfile.profileId
        setMainSystemId(suggestedProfile.profileId)
      }

      const mainSystem = profiles.find((p) => String(p.id) === String(runtimeSystemId))
      if (!mainSystem) return alert('⚠️ النظام الفني غير موجود!')
      const selectedReview =
        compatibilityPlan.eligible.find((entry) => entry.profileId === String(runtimeSystemId)) ||
        compatibilityPlan.excluded.find((entry) => entry.profileId === String(runtimeSystemId)) ||
        null

      if (selectedReview && !selectedReview.eligible) {
        const reason = selectedReview.exclusions?.[0] || 'القطاع المختار غير متوافق مع إعدادات العنصر.'
        return alert(`⚠️ لا يمكن الإدراج: ${reason}`)
      }

      const runtimeValidation = validateTechnicalSystem(mainSystem, masterInventory, {
        opening: windowInput
      })
      if (runtimeValidation.errors.length > 0) {
        return alert(`⚠️ ${runtimeValidation.errors[0]}`)
      }

      const compiled = compileTechnicalSystemWindow({
        system: mainSystem,
        opening: windowInput
      })

      if (compiled.errors.length > 0) {
        return alert(`⚠️ ${compiled.errors[0]}`)
      }

      const inserted = appendProductionBatch(compiled, {
        requirePieces: true,
        emptyAlert: '⚠️ لم ينتج إدراج النافذة أي قطع فعلية. راجع النظام الفني والمقاسات.'
      })
      if (inserted) alert('✅ تم إضافة النافذة بنجاح.')
    } catch (error) {
      console.error(error)
      alert('⚠️ خطأ في الحسابات، تأكد من إدخال الأرقام.')
    }
  }

  const addGlassPieceToList = () => {
    const w = parseArabicNum(currentGlassPiece.w)
    const h = parseArabicNum(currentGlassPiece.h)
    const qty = parseInt(parseArabicNum(currentGlassPiece.qty)) || 1
    if (!w || !h) return alert('الرجاء إدخال العرض والارتفاع!')
    setGlassPiecesList((prev) => [
      ...prev,
      { id: Date.now(), w, h, qty, label: currentGlassPiece.label }
    ])
    setCurrentGlassPiece({ w: '', h: '', qty: '1', label: 'زجاج نافذة' })
  }

  const run2DOptimization = () => {
    const sheetW = parseArabicNum(glassRawSheet.w)
    const sheetH = parseArabicNum(glassRawSheet.h)
    const blade = parseArabicNum(glassRawSheet.blade)
    if (!sheetW || !sheetH) return alert('الرجاء تحديد أبعاد اللوح الخام!')
    if (glassPiecesList.length === 0) return alert('الرجاء إضافة قطع للقص!')

    let piecesToCut = []
    glassPiecesList.forEach((p) => {
      for (let i = 0; i < p.qty; i++) {
        if ((p.w > sheetW && p.w > sheetH) || (p.h > sheetW && p.h > sheetH)) {
          alert(`القطعة (${p.w} × ${p.h}) أكبر من اللوح الخام!`)
          return
        }
        piecesToCut.push({ ...p, w: parseFloat(p.w), h: parseFloat(p.h) })
      }
    })

    piecesToCut.sort((a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h) || b.w * b.h - a.w * a.h)

    let activeSheets = []
    const findFit = (piece, rects) => {
      let bestFit = null
      let minArea = Infinity
      for (let i = 0; i < rects.length; i++) {
        let rect = rects[i]
        if (piece.w <= rect.w && piece.h <= rect.h) {
          let areaFit = rect.w * rect.h - piece.w * piece.h
          if (areaFit < minArea) {
            minArea = areaFit
            bestFit = { idx: i, rotated: false }
          }
        }
        if (piece.h <= rect.w && piece.w <= rect.h) {
          let areaFit = rect.w * rect.h - piece.h * piece.w
          if (areaFit < minArea) {
            minArea = areaFit
            bestFit = { idx: i, rotated: true }
          }
        }
      }
      return bestFit
    }

    const performCut = (sheet, piece, fit, blade) => {
      let rect = sheet.freeRects.splice(fit.idx, 1)[0]
      let cutW = fit.rotated ? piece.h : piece.w
      let cutH = fit.rotated ? piece.w : piece.h
      sheet.cuts.push({
        ...piece,
        x: rect.x,
        y: rect.y,
        cutW,
        cutH,
        rotated: fit.rotated,
        step: sheet.cuts.length + 1
      })
      sheet.wasteArea -= cutW * cutH
      let wSplit1 = { x: rect.x + cutW + blade, y: rect.y, w: rect.w - cutW - blade, h: cutH }
      let wSplit2 = { x: rect.x, y: rect.y + cutH + blade, w: rect.w, h: rect.h - cutH - blade }
      let hSplit1 = { x: rect.x + cutW + blade, y: rect.y, w: rect.w - cutW - blade, h: rect.h }
      let hSplit2 = { x: rect.x, y: rect.y + cutH + blade, w: cutW, h: rect.h - cutH - blade }
      let splitWMaxArea = Math.max(wSplit1.w * wSplit1.h, wSplit2.w * wSplit2.h)
      let splitHMaxArea = Math.max(hSplit1.w * hSplit1.h, hSplit2.w * hSplit2.h)

      if (splitWMaxArea > splitHMaxArea) {
        if (wSplit1.w > 0 && wSplit1.h > 0) sheet.freeRects.push(wSplit1)
        if (wSplit2.w > 0 && wSplit2.h > 0) sheet.freeRects.push(wSplit2)
      } else {
        if (hSplit1.w > 0 && hSplit1.h > 0) sheet.freeRects.push(hSplit1)
        if (hSplit2.w > 0 && hSplit2.h > 0) sheet.freeRects.push(hSplit2)
      }
    }

    piecesToCut.forEach((piece) => {
      let placed = false
      for (let i = 0; i < activeSheets.length; i++) {
        let fit = findFit(piece, activeSheets[i].freeRects)
        if (fit) {
          performCut(activeSheets[i], piece, fit, blade)
          placed = true
          break
        }
      }
      if (!placed) {
        let newSheet = {
          sheetNum: activeSheets.length + 1,
          w: sheetW,
          h: sheetH,
          freeRects: [{ x: 0, y: 0, w: sheetW, h: sheetH }],
          cuts: [],
          wasteArea: sheetW * sheetH
        }
        let fit = findFit(piece, newSheet.freeRects)
        if (fit) performCut(newSheet, piece, fit, blade)
        activeSheets.push(newSheet)
      }
    })
    setGlassCutResults(activeSheets)
  }

  const navItems = flatNavigationItems

  const productionNeedsModel = useMemo(
    () =>
      buildProductionNeedsModel({
        neededPieces,
        neededGlass,
        neededAccessories,
        neededOperations,
        inventory: masterInventory,
        bladeThickness
      }),
    [bladeThickness, masterInventory, neededAccessories, neededGlass, neededOperations, neededPieces]
  )

  const {
    currentProjectResults,
    aggregatedAccessories,
    aggregatedOperations,
    rawCosts,
    totalCost
  } = productionNeedsModel

  const groupedWorkshopOperations = useMemo(() => {
    const groups = {}
    aggregatedOperations.forEach((operation) => {
      const key = operation.category || 'assembly'
      if (!groups[key]) groups[key] = []
      groups[key].push(operation)
    })
    return groups
  }, [aggregatedOperations])

  const contractProjects = useMemo(
    () => savedProjects.filter((project) => isContractProject(project)),
    [savedProjects]
  )

  const currentLinkedProject = useMemo(
    () => savedProjects.find((project) => project.id === projectInfo.id) || null,
    [savedProjects, projectInfo.id]
  )

  const isCurrentContractLinked = useMemo(() => {
    if (currentLinkedProject) return isContractProject(currentLinkedProject)
    return isContractProject({ info: projectInfo })
  }, [currentLinkedProject, projectInfo])

  const previousProjectMaterialFlow = useMemo(() => {
    if (!currentLinkedProject || currentLinkedProject.materialFlow) {
      return currentLinkedProject?.materialFlow || null
    }

    if (!isContractProject(currentLinkedProject)) return null

    const aluminumGroups = {}
    ;(currentLinkedProject.pieces || []).forEach((piece) => {
      const key = piece.inventoryId || piece.label
      if (!aluminumGroups[key]) {
        const inventoryItem = masterInventory.find((item) => item.id === piece.inventoryId)
        aluminumGroups[key] = {
          inventoryId: piece.inventoryId,
          pieces: [],
          barLength: inventoryItem?.length ? parseFloat(inventoryItem.length) : 5.8
        }
      }
      aluminumGroups[key].pieces.push(piece)
    })

    const aluminum = Object.values(aluminumGroups).map((group) => ({
      inventoryId: group.inventoryId,
      consumedQty: optimizeCutting(group.pieces, group.barLength, bladeThickness, 6.5).length
    }))

    const accessoryGroups = {}
    ;(currentLinkedProject.accessories || []).forEach((item) => {
      if (!item.inventoryId) return
      accessoryGroups[item.inventoryId] =
        (accessoryGroups[item.inventoryId] || 0) + (Number(item.quantity) || 0)
    })

    return {
      aluminum,
      glass: [],
      accessories: Object.entries(accessoryGroups).map(([inventoryId, consumedQty]) => ({
        inventoryId,
        consumedQty
      }))
    }
  }, [bladeThickness, currentLinkedProject, masterInventory])

  const inventoryBaseline = useMemo(
    () =>
      isCurrentContractLinked
        ? buildInventoryBaseline(masterInventory, previousProjectMaterialFlow)
        : masterInventory.map((item) => ({ ...item })),
    [isCurrentContractLinked, masterInventory, previousProjectMaterialFlow]
  )

  const materialFlowSnapshot = useMemo(
    () =>
      buildMaterialFlowSnapshot({
        isContractLinked: isCurrentContractLinked,
        currentProjectResults,
        neededGlass,
        aggregatedAccessories,
        inventory: inventoryBaseline
      }),
    [
      aggregatedAccessories,
      currentProjectResults,
      inventoryBaseline,
      isCurrentContractLinked,
      neededGlass
    ]
  )

  const financialSummary = useMemo(() => {
    const contractSubtotal = projectInfo.contractItems.reduce((acc, item) => {
      return (
        acc +
        (parseArabicNum(item.qty) || 0) *
          (parseArabicNum(item.sqm) || 0) *
          (parseArabicNum(item.pricePerSqm) || 0)
      )
    }, 0)
    const contractTax = projectInfo.applyTax
      ? contractSubtotal * (parseArabicNum(projectInfo.taxRate) / 100)
      : 0
    const finalContractValue = contractSubtotal + contractTax
    const paidAmt =
      projectInfo.payments?.reduce((sum, p) => sum + (parseArabicNum(p.amount) || 0), 0) || 0
    return {
      subtotal: contractSubtotal,
      tax: contractTax,
      contractVal: finalContractValue,
      paidAmt,
      expectedProfit: finalContractValue - totalCost,
      remainingBalance: finalContractValue - paidAmt
    }
  }, [
    projectInfo.contractItems,
    projectInfo.applyTax,
    projectInfo.taxRate,
    projectInfo.payments,
    totalCost
  ])

  const productionFinancialSummary = useMemo(
    () =>
      isCurrentContractLinked
        ? {
            ...financialSummary,
            consumedMaterialsValue: materialFlowSnapshot.totals.consumedValue,
            shortageValue: materialFlowSnapshot.totals.shortageValue
          }
        : {
            subtotal: 0,
            tax: 0,
            contractVal: 0,
            paidAmt: 0,
            expectedProfit: 0,
            remainingBalance: 0,
            consumedMaterialsValue: 0,
            shortageValue: 0
          },
    [financialSummary, isCurrentContractLinked, materialFlowSnapshot.totals]
  )

  const currentReportContractSnapshot = useMemo(() => {
    if (!isCurrentContractLinked) return null

    return buildContractExecutionSnapshot({
      id: projectInfo.id || currentLinkedProject?.id || null,
      workflowMode: 'contract',
      info: projectInfo,
      pieces: neededPieces,
      accessories: neededAccessories,
      glass: neededGlass,
      operations: neededOperations,
      totalCost,
      contractValue: productionFinancialSummary.contractVal,
      paidAmount: productionFinancialSummary.paidAmt,
      materialFlow: materialFlowSnapshot,
      updatedAt:
        projectInfo.statusChangedAt || currentLinkedProject?.updatedAt || new Date().toISOString()
    })
  }, [
    currentLinkedProject?.id,
    currentLinkedProject?.updatedAt,
    isCurrentContractLinked,
    materialFlowSnapshot,
    neededAccessories,
    neededGlass,
    neededOperations,
    neededPieces,
    productionFinancialSummary.contractVal,
    productionFinancialSummary.paidAmt,
    projectInfo,
    totalCost
  ])

  const dashboardStats = useMemo(() => {
    let totalContracts = 0,
      totalProfits = 0,
      totalMaterialCosts = 0
    savedProjects.forEach((p) => {
      const cv = parseArabicNum(p.contractValue) || 0
      const cost = parseArabicNum(p.totalCost) || 0
      const profit = parseArabicNum(p.profit) || 0
      totalContracts += cv
      totalProfits += profit
      totalMaterialCosts += cost
    })
    const leftoversLength = leftovers.reduce((sum, l) => sum + (parseArabicNum(l.length) || 0), 0)
    return { totalContracts, totalProfits, totalMaterialCosts, leftoversLength }
  }, [savedProjects, leftovers])

  const quotationTotals = useMemo(() => {
    const safeQuoteItems = Array.isArray(quoteItems) ? quoteItems : []
    const subtotal = safeQuoteItems.reduce((acc, item) => {
      if (item.isHidden) return acc
      return acc + (parseArabicNum(item.col_qty) || 0) * (parseArabicNum(item.col_price) || 0)
    }, 0)
    const discountAmt = parseArabicNum(quoteConfig?.discount) || 0
    const afterDiscount = Math.max(0, subtotal - discountAmt)
    const tax = afterDiscount * ((parseArabicNum(quoteConfig?.taxRate) || 0) / 100)
    return { subtotal, discount: discountAmt, afterDiscount, tax, total: afterDiscount + tax }
  }, [quoteItems, quoteConfig?.taxRate, quoteConfig?.discount])

  const inventoryAlerts = useMemo(() => {
    let alerts = []
    neededPieces.forEach((p) => {
      const extType = getExtrusionType(p.label)
      const match = leftovers.find(
        (l) => l.profileId === p.profileId && l.extrusionType === extType && l.length >= p.length
      )
      if (match)
        alerts.push({
          msg: `تنبيه توفير: يوجد فضلة لقطاع ${match.profileName} - ${extType} بطول (${match.length}م)!`,
          leftoverId: match.id
        })
    })
    const uniqueAlerts = []
    const seenIds = new Set()
    for (const alert of alerts) {
      if (!seenIds.has(alert.leftoverId)) {
        seenIds.add(alert.leftoverId)
        uniqueAlerts.push(alert)
      }
    }
    return uniqueAlerts
  }, [neededPieces, leftovers])

  const productionOrderSnapshot = useMemo(
    () =>
      buildProductionOrderSnapshot({
        isContractLinked: isCurrentContractLinked,
        neededPieces,
        neededGlass,
        aggregatedAccessories,
        aggregatedOperations,
        currentProjectResults,
        rawCosts,
        totalCost,
        materialFlowSnapshot,
        financialSummary: productionFinancialSummary,
        inventoryAlerts
      }),
    [
      aggregatedAccessories,
      aggregatedOperations,
      currentProjectResults,
      inventoryAlerts,
      isCurrentContractLinked,
      materialFlowSnapshot,
      neededGlass,
      neededPieces,
      productionFinancialSummary,
      rawCosts,
      totalCost
    ]
  )

  const hasPurchaseShortages = productionOrderSnapshot.procurement.hasShortages

  const activeContractsWithShortages = useMemo(
    () =>
      contractProjects.filter((project) => {
        const executionStatus = deriveContractExecutionStatus(project)
        return executionStatus !== 'completed' && countPurchaseShortageLines(project) > 0
      }),
    [contractProjects]
  )

  const completedContractProjects = useMemo(
    () =>
      contractProjects.filter((project) => deriveContractExecutionStatus(project) === 'completed'),
    [contractProjects]
  )

  const nonContractRecordsCount = useMemo(
    () => savedProjects.filter((project) => getSavedProjectRecordType(project) !== 'contract').length,
    [savedProjects]
  )

  const liveShortagesSummary = useMemo(
    () => buildLiveShortagesSummary(productionOrderSnapshot),
    [productionOrderSnapshot]
  )

  const safeOpenTab = (tab, label) => {
    if (isTabAllowed(tab)) {
      setActiveTab(tab)
      return
    }

    redirectToAllowedTab(label)
  }

  const openContractsHub = (tab = 'project') => {
    const resolvedTab = ['project', 'quotation'].includes(tab) ? tab : 'project'
    safeOpenTab(resolvedTab, resolvedTab === 'quotation' ? 'عرض العميل' : 'ملف العقد')
  }

  const openProductionHub = (tab = 'cutting') => {
    const allowedTabs = new Set(['cutting', 'reports', 'glass'])
    const resolvedTab = allowedTabs.has(tab) ? tab : 'cutting'
    const labelByTab = {
      cutting: 'أمر الإنتاج',
      reports: 'تقارير الورشة',
      glass: 'قص الزجاج'
    }
    safeOpenTab(resolvedTab, labelByTab[resolvedTab] || 'أمر الإنتاج')
  }

  const openMaterialsHub = (tab = 'inventory') => {
    const resolvedTab = ['inventory', 'procurement'].includes(tab) ? tab : 'inventory'
    safeOpenTab(resolvedTab, resolvedTab === 'procurement' ? 'مركز المشتريات' : 'المخزون')
  }

  const openAdminHub = (tab = 'profiles') => {
    const resolvedTab = ['profiles', 'settings'].includes(tab) ? tab : 'profiles'
    safeOpenTab(resolvedTab, resolvedTab === 'settings' ? 'الإعدادات' : 'الأنظمة الفنية')
  }

  const openExecutionHub = () => {
    safeOpenTab('history', 'العقود والتنفيذ')
  }

  const resolvedNavTab = useMemo(() => {
    if (['project', 'quotation'].includes(activeTab)) return 'contracts_hub'
    if (['cutting', 'reports', 'glass', 'cutting-legacy'].includes(activeTab)) {
      return 'production_hub'
    }
    if (['inventory', 'procurement'].includes(activeTab)) return 'materials_hub'
    if (['profiles', 'settings'].includes(activeTab)) return 'admin_hub'
    if (activeTab === 'history') return 'execution_hub'
    return 'dashboard'
  }, [activeTab])

  const handleNavigateHub = (nextTab) => {
    if (!isHubAllowed(nextTab)) {
      const labelByHub = {
        dashboard: 'لوحة اليوم',
        contracts_hub: 'ملف العقد',
        production_hub: 'أمر الإنتاج',
        materials_hub: 'المواد والمشتريات',
        execution_hub: 'العقود والتنفيذ',
        admin_hub: 'الإدارة الفنية'
      }
      redirectToAllowedTab(labelByHub[nextTab] || 'هذه الشاشة')
      return
    }

    switch (nextTab) {
      case 'contracts_hub':
        openContractsHub('project')
        break
      case 'production_hub':
        openProductionHub('cutting')
        break
      case 'materials_hub':
        openMaterialsHub('inventory')
        break
      case 'execution_hub':
        openExecutionHub()
        break
      case 'admin_hub':
        openAdminHub('profiles')
        break
      default:
        safeOpenTab('dashboard', 'لوحة اليوم')
    }
  }

  const filteredNavSections = useMemo(
    () =>
      appNavigation
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => isHubAllowed(item.id))
        }))
        .filter((section) => section.items.length > 0),
    [licenseAccess]
  )

  const visibleNavItems = useMemo(
    () => filteredNavSections.flatMap((section) => section.items),
    [filteredNavSections]
  )

  const currentNavItem =
    visibleNavItems.find((item) => item.id === resolvedNavTab) || visibleNavItems[0] || navItems[0]

  const contractHubTabs = [
    {
      id: 'project',
      label: 'ملف العقد',
      helper: 'العميل، البنود، الدفعات، وربط التنفيذ'
    },
    {
      id: 'quotation',
      label: 'عرض العميل',
      helper: 'العرض النهائي والطباعة والهوية البصرية'
    }
  ]
  const productionHubTabs = [
    {
      id: 'cutting',
      label: 'أمر الإنتاج',
      helper: 'المقاسات، اختيار القطاع المناسب، والخامات المستخرجة'
    },
    {
      id: 'reports',
      label: 'تقارير الورشة',
      helper: 'التكلفة، النواقص، خريطة القص، والباركود'
    },
    {
      id: 'glass',
      label: 'قص الزجاج',
      helper: 'ألواح الزجاج والخرائط الثنائية للألواح'
    }
  ]
  const materialsHubTabs = [
    {
      id: 'inventory',
      label: 'المخزون',
      helper: 'الخامات والبواقي والرصد الفعلي للمستودع'
    },
    {
      id: 'procurement',
      label: 'مركز المشتريات',
      helper: 'نواقص العقود التي تحتاج طلب شراء'
    }
  ]
  const adminHubTabs = [
    {
      id: 'profiles',
      label: 'الأنظمة الفنية',
      helper: 'القطاعات، المعادلات، الإكسسوارات، وعمليات الورشة'
    },
    {
      id: 'settings',
      label: 'الإدارة والإعدادات',
      helper: 'بيانات المؤسسة، الاستيراد، والتصدير'
    }
  ]

  const visibleContractHubTabs = contractHubTabs.filter((tab) => isTabAllowed(tab.id))
  const visibleProductionHubTabs = productionHubTabs.filter((tab) => isTabAllowed(tab.id))
  const visibleMaterialsHubTabs = materialsHubTabs.filter((tab) => isTabAllowed(tab.id))
  const visibleAdminHubTabs = adminHubTabs.filter((tab) => isTabAllowed(tab.id))
  const saveProject = () => {
    if (!projectInfo.clientName) return alert('يرجى إدخال اسم العميل لحفظ المشروع/المقايسة.')

    const currentId = projectInfo.id || Date.now()
    const workflowMode = isCurrentContractLinked ? 'contract' : 'measurement'
    const contractItemsForSave =
      !projectInfo.contractItems ||
      projectInfo.contractItems.length === 0 ||
      !projectInfo.contractItems[0].name
        ? [
            {
              ...createDefaultContractItem(),
              name: 'مقايسة عامة (بدون تسعير)',
              qty: '1',
              sqm: '0',
              pricePerSqm: '0'
            }
          ]
        : projectInfo.contractItems
    const lifecycleInfo = buildContractLifecycleForSave({
      projectInfo,
      workflowMode,
      materialFlowSnapshot,
      pieces: neededPieces,
      accessories: neededAccessories,
      glass: neededGlass,
      operations: neededOperations,
      existingProject: currentLinkedProject
    })
    const projectInfoForSave = {
      ...projectInfo,
      id: currentId,
      contractItems: contractItemsForSave,
      workflowMode,
      ...lifecycleInfo
    }

    if (isCurrentContractLinked) {
      const updatedMaster = applyMaterialConsumptionToInventory({
        inventory: inventoryBaseline,
        materialFlow: materialFlowSnapshot
      })

      setMasterInventory(updatedMaster)

      if (!currentLinkedProject || currentLinkedProject.materialFlow) {
        const newLeftovers = buildProjectLeftovers({
          projectId: currentId,
          currentProjectResults,
          materialFlow: materialFlowSnapshot
        })

        setLeftovers((prev) => [
          ...prev.filter((leftover) => leftover.sourceProjectId !== currentId),
          ...newLeftovers
        ])
      }
    }

    const projectToSave = {
      id: currentId,
      workflowMode,
      recordType: isCurrentContractLinked ? 'contract' : 'measurement',
      createdAt: currentLinkedProject?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      info: projectInfoForSave,
      pieces: [...neededPieces],
      accessories: [...neededAccessories],
      glass: [...neededGlass],
      operations: [...neededOperations],
      totalCost: isCurrentContractLinked ? totalCost : 0,
      contractValue: productionFinancialSummary.contractVal,
      paidAmount: productionFinancialSummary.paidAmt,
      profit: productionFinancialSummary.expectedProfit,
      materialFlow: materialFlowSnapshot,
      stockImpactApplied: isCurrentContractLinked,
      quoteConfig: { ...quoteConfig },
      quoteItems: [...quoteItems]
    }

    if (projectInfo.id) {
      setSavedProjects((prev) => prev.map((p) => (p.id === currentId ? projectToSave : p)))
      setProjectInfo(projectInfoForSave)
      alert(
        isCurrentContractLinked
          ? 'تم تحديث العقد وأثره على المخزون والطلبيات بنجاح!'
          : 'تم تحديث المقايسة الحرة بدون أي خصم من المخزون.'
      )
      openProductionHub('reports')
    } else {
      setSavedProjects((prev) => [projectToSave, ...prev])
      let successMsg = isCurrentContractLinked
        ? 'تم حفظ أمر الإنتاج المرتبط بالعقد وتحديث المخزون الفعلي.'
        : 'تم حفظ المقايسة الحرة كتحليل فني فقط بدون أي خصم من المخزون.'

      if (isCurrentContractLinked) {
        const shortageLines = productionOrderSnapshot.procurement.shortageLinesCount

        successMsg += `\n- تم صرف المواد المتاحة من المستودع.`
        successMsg += `\n- تم تجهيز ${shortageLines} بند نواقص لتقرير الطلبية.`
      }

      setProjectInfo(projectInfoForSave)
      alert(successMsg)
      openProductionHub('reports')
    }
  }

  const loadProject = (proj) => {
    let loadedInfo = { ...proj.info }
    if (!loadedInfo.payments)
      loadedInfo.payments =
        proj.paidAmount > 0
          ? [
              {
                id: `legacy-payment-${proj.id || 'draft'}`,
                amount: proj.paidAmount,
                date: loadedInfo.date,
                note: 'دفعة سابقة'
              }
            ]
          : []
    if (!loadedInfo.contractItems)
      loadedInfo.contractItems = [
        {
          id: 1,
          name: 'عقد سابق',
          qty: '1',
          sqm: '1',
          pricePerSqm: proj.contractValue || '0'
        }
      ]
    if (isContractProject(proj)) {
      loadedInfo.executionStatus =
        loadedInfo.executionStatus || deriveContractExecutionStatus(proj) || 'draft'
      loadedInfo.completedAt = loadedInfo.completedAt || proj.completedAt || ''
      loadedInfo.statusChangedAt = loadedInfo.statusChangedAt || proj.updatedAt || ''
    }
    const normalizedProjectBatch = normalizeProductionBatch({
      pieces: proj.pieces || [],
      accessories: proj.accessories || [],
      glass: proj.glass || [],
      operations: proj.operations || []
    })
    setProjectInfo(loadedInfo)
    setNeededPieces(normalizedProjectBatch.pieces)
    setNeededAccessories(normalizedProjectBatch.accessories)
    setNeededGlass(normalizedProjectBatch.glass)
    setNeededOperations(normalizedProjectBatch.operations)
    if (proj.quoteConfig) {
      setQuoteConfig({
        ...proj.quoteConfig,
        columns: proj.quoteConfig.columns || defaultQuoteColumns
      })
    } else {
      setQuoteConfig(createDefaultQuoteConfig())
    }
    const loadedQuoteItems = (proj.quoteItems || []).map((item) => {
      if (item.name !== undefined)
        return {
          ...item,
          col_name: item.name,
          col_details: item.details,
          col_qty: item.qty,
          col_price: item.price
        }
      return item
    })
    if (loadedQuoteItems.length > 0) setQuoteItems(loadedQuoteItems)
    else setQuoteItems(createDefaultQuoteItems())

    const recordType = getSavedProjectRecordType(proj)
    if (recordType === 'contract') openContractsHub('project')
    else openProductionHub('cutting')
  }

  const handleLinkToContract = (selectedId) => {
    if (selectedId) {
      const existingProject = savedProjects.find((p) => p.id === Number(selectedId))
      if (existingProject) {
        let loadedInfo = { ...existingProject.info }
        const normalizedExistingBatch = normalizeProductionBatch({
          pieces: existingProject.pieces || [],
          accessories: existingProject.accessories || [],
          glass: existingProject.glass || [],
          operations: existingProject.operations || []
        })
        setProjectInfo(loadedInfo)
        setNeededPieces(normalizedExistingBatch.pieces)
        setNeededAccessories(normalizedExistingBatch.accessories)
        setNeededGlass(normalizedExistingBatch.glass)
        setNeededOperations(normalizedExistingBatch.operations)
      }
    } else {
      setProjectInfo((prev) => ({ ...prev, id: null, contractItems: [] }))
      setNeededPieces([])
      setNeededAccessories([])
      setNeededGlass([])
      setNeededOperations([])
    }
  }

  const createNewProject = () => {
    setProjectInfo(createDefaultProjectInfo())
    setNeededPieces([])
    setNeededAccessories([])
    setNeededGlass([])
    setNeededOperations([])
    setQuoteConfig(createDefaultQuoteConfig())
    setQuoteItems(createDefaultQuoteItems())
  }

  const handleResetWorkspace = () => {
    requestConfirm(
      '⚠️ هل أنت متأكد من تصفير مساحة العمل؟\n\nسيتم مسح أي بيانات أو مقاسات حالية لم تقم بحفظها.\n(لن يتم المساس بالمستودع أو مركز العقود والتنفيذ أو الكتالوج)',
      () => {
        createNewProject()
        setWindowInput(createDefaultWindowInput())
        setGlassPiecesList([])
        setGlassCutResults(null)
        setCurrentGlassPiece(createDefaultGlassPiece())
        safeOpenTab('dashboard', 'لوحة اليوم')
        alert('تم تصفير مساحة العمل بنجاح. البرنامج جاهز لعميل جديد!')
      }
    )
  }

  const deleteLeftover = (id) => {
    setLeftovers((prev) => prev.filter((l) => l.id !== id))
  }

  const addPayment = () => {
    const amt = parseArabicNum(newPayment.amount)
    if (!amt || amt <= 0) return alert('أدخل مبلغ صحيح')
    const newPaymentRecord = {
      id: Date.now(),
      amount: amt,
      date: newPayment.date || new Date().toLocaleDateString(),
      note: newPayment.note || 'دفعة نقدية'
    }

    setProjectInfo((prev) => {
      const updatedPayments = [...(prev.payments || []), newPaymentRecord]
      const updatedInfo = { ...prev, payments: updatedPayments }
      if (prev.id) {
        setSavedProjects((sp) =>
          sp.map((p) =>
            p.id === prev.id
              ? {
                  ...p,
                  info: updatedInfo,
                  paidAmount: updatedInfo.payments.reduce(
                    (s, pay) => s + (parseArabicNum(pay.amount) || 0),
                    0
                  )
                }
              : p
          )
        )
      }
      return updatedInfo
    })

    setNewPayment(createDefaultPaymentDraft())
    setIsPaymentModalOpen(false)
    alert('تم تسجيل الدفعة في العقد بنجاح!')
  }

  const deletePayment = (paymentId) => {
    requestConfirm('هل أنت متأكد من حذف الدفعة؟', () => {
      setProjectInfo((prev) => {
        const updatedPayments = prev.payments.filter((p) => p.id !== paymentId)
        const updatedInfo = { ...prev, payments: updatedPayments }
        if (prev.id) {
          setSavedProjects((sp) =>
            sp.map((p) =>
              p.id === prev.id
                ? {
                    ...p,
                    info: updatedInfo,
                    paidAmount: updatedInfo.payments.reduce(
                      (s, pay) => s + (parseArabicNum(pay.amount) || 0),
                      0
                    )
                  }
                : p
            )
          )
        }
        return updatedInfo
      })
    })
  }

  const deleteSavedProject = (id) => {
    requestConfirm('هل أنت متأكد من حذف المشروع نهائياً؟', () => {
      setSavedProjects((prev) => prev.filter((p) => p.id !== id))
      if (projectInfo.id === id) createNewProject()
    })
  }

  const updateContractExecutionStatus = (id, nextStatus) => {
    const localeDate = new Date().toLocaleDateString()
    const statusChangedAt = new Date().toISOString()

    setSavedProjects((prev) =>
      prev.map((project) =>
        project.id === id
          ? {
              ...project,
              updatedAt: statusChangedAt,
              info: {
                ...project.info,
                executionStatus: nextStatus,
                completedAt:
                  nextStatus === 'completed' ? project.info?.completedAt || localeDate : '',
                statusChangedAt
              }
            }
          : project
      )
    )

    if (projectInfo.id === id) {
      setProjectInfo((prev) => ({
        ...prev,
        executionStatus: nextStatus,
        completedAt: nextStatus === 'completed' ? prev.completedAt || localeDate : '',
        statusChangedAt
      }))
    }
  }

  const markContractAsCompleted = (id) => {
    requestConfirm(
      'هل تريد نقل هذا العقد إلى قسم العقود المكتملة؟ سيتم الاحتفاظ بكل بياناته المالية والفنية كاملة.',
      () => {
        updateContractExecutionStatus(id, 'completed')
        alert('تم نقل العقد إلى العقود المكتملة بنجاح.')
      }
    )
  }

  const markContractAsReady = (id) => {
    requestConfirm('هل تريد رفع حالة العقد إلى جاهز للتسليم؟', () => {
      updateContractExecutionStatus(id, 'ready_installation')
      alert('تم تحديث العقد إلى جاهز للتسليم.')
    })
  }

  const returnContractToProduction = (id) => {
    requestConfirm('هل تريد إعادة العقد إلى قيد التنفيذ داخل الورشة؟', () => {
      updateContractExecutionStatus(id, 'in_progress')
      alert('تمت إعادة العقد إلى قيد التنفيذ.')
    })
  }

  const reopenContractExecution = (id) => {
    requestConfirm('هل تريد إعادة العقد إلى قسم عقود تحت التشغيل؟', () => {
      const targetProject = savedProjects.find((project) => project.id === id)
      const nextStatus =
        countPurchaseShortageLines(targetProject) > 0 ? 'awaiting_material' : 'in_progress'

      updateContractExecutionStatus(id, nextStatus)
      alert('تمت إعادة العقد إلى عقود تحت التشغيل.')
    })
  }

  const addContractItem = () => {
    setProjectInfo((prev) => ({
      ...prev,
      contractItems: [...prev.contractItems, createDefaultContractItem(Date.now())]
    }))
  }
  const removeContractItem = (id) => {
    setProjectInfo((prev) => ({
      ...prev,
      contractItems:
        prev.contractItems.length > 1
          ? prev.contractItems.filter((item) => item.id !== id)
          : prev.contractItems
    }))
  }
  const updateContractItem = (id, field, value) => {
    setProjectInfo((prev) => ({
      ...prev,
      contractItems: prev.contractItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }))
  }

  const updateQuoteItem = (id, field, value) => {
    setQuoteItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }
  const addQuoteItem = () => {
    setQuoteItems((prev) => [...prev, createDefaultQuoteItem(Date.now())])
  }
  const removeQuoteItem = (id) => {
    setQuoteItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev))
  }
  const addQuoteColumn = () => {
    setQuoteConfig((prev) => ({
      ...prev,
      columns: [
        ...(prev.columns || []),
        { id: 'custom_' + Date.now(), label: 'عمود جديد', visible: true, isCustom: true }
      ]
    }))
  }
  const updateQuoteColumn = (colId, field, val) => {
    setQuoteConfig((prev) => ({
      ...prev,
      columns: (prev.columns || []).map((c) => (c.id === colId ? { ...c, [field]: val } : c))
    }))
  }
  const deleteQuoteColumn = (colId) => {
    setQuoteConfig((prev) => ({
      ...prev,
      columns: (prev.columns || []).filter((c) => c.id !== colId)
    }))
  }

  const handleImportFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result)
        if (Array.isArray(json) && json.length > 0 && json[0].systemType) {
          setImportedData(json)
          const types = [...new Set(json.map((item) => item.systemType))]
          const initialMapping = {}
          types.forEach((t) => (initialMapping[t] = ''))
          setImportMapping(initialMapping)
          setIsImportModalOpen(true)
        } else {
          alert('صيغة الملف غير صحيحة.')
        }
      } catch {
        alert('فشل في قراءة الملف.')
      }
    }
    reader.readAsText(file)
    e.target.value = null
  }

  const processImportedData = () => {
    if (Object.values(importMapping).some((val) => !val))
      return alert('الرجاء ربط جميع الأنواع بقطاعات!')
    let newPieces = []
    let newGlass = []
    let newAccs = []
    let newOps = []
    const entityIdBase = Date.now()
    importedData.forEach((item, index) => {
      const w = parseArabicNum(item.width)
      const h = parseArabicNum(item.height)
      const qty = parseInt(parseArabicNum(item.qty)) || 1
      const mappedProfileId = parseInt(importMapping[item.systemType])
      const sys = profiles.find((p) => p.id === mappedProfileId)
      if (!sys || !w || !h) return
      const entityId = entityIdBase + index
      const compiled = compileTechnicalSystemWindow({
        system: sys,
        opening: {
          width: w,
          height: h,
          quantity: qty,
          label: item.label,
          isComplex: false,
          sections: [{ type: item.systemType === 'fixed' ? 'fixed' : 'sash', h }]
        }
      })

      newPieces.push(...compiled.pieces.map((piece) => ({ ...piece, entityId })))
      newGlass.push(...compiled.glass.map((glassPiece) => ({ ...glassPiece, entityId })))
      newAccs.push(...compiled.accessories.map((accessory) => ({ ...accessory, entityId })))
      newOps.push(...compiled.operations.map((operation) => ({ ...operation, entityId })))
    })
    const inserted = appendProductionBatch({
      pieces: newPieces,
      glass: newGlass,
      accessories: newAccs,
      operations: newOps
    })
    if (!inserted) return

    setIsImportModalOpen(false)
    alert(`تم استيراد (${importedData.length}) نوافذ بنجاح!`)
  }

  const handleAddNewInventoryItem = () => {
    if (!newInventoryItem.name || !newInventoryItem.price) return alert('الرجاء إدخال الاسم والسعر')
    const newItem = {
      id: 'item_' + Date.now(),
      category:
        inventoryActiveTab === 'aluminum'
          ? 'aluminum'
          : inventoryActiveTab === 'accessories'
            ? 'accessory'
            : 'glass',
      name: newInventoryItem.name,
      price: parseFloat(parseArabicNum(newInventoryItem.price)) || 0,
      stockQty: parseInt(parseArabicNum(newInventoryItem.stockQty)) || 0,
      length:
        inventoryActiveTab === 'aluminum'
          ? parseFloat(parseArabicNum(newInventoryItem.length)) || 5.8
          : null
    }
    setMasterInventory((prev) => [newItem, ...prev])
    setNewInventoryItem(createDefaultInventoryItem())
  }

  const handleUpdateMasterStock = (id, field, value) => {
    const parsed = field === 'name' ? value : parseFloat(parseArabicNum(value)) || 0
    setMasterInventory((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: parsed } : i)))
  }

  const openAddProfile = () => {
    setEditingProfile(null)
    setProfileModalTab('basic')
    setProfileFormData(createDefaultProfileFormData())
    setProfileSimulationInput(createTechnicalSystemSimulationInput())
    setIsProfileModalOpen(true)
  }
  const openEditProfile = (p) => {
    setEditingProfile(p)
    setProfileModalTab('basic')
    const normalizedProfile = normalizeTechnicalSystem(p)
    setProfileFormData({
      ...normalizedProfile,
      physics: {
        ...defaultTechnicalSystemPhysics,
        ...(normalizedProfile.physics || {})
      },
      structuredFormulas: normalizedProfile.structuredFormulas || [],
      accessories: normalizedProfile.accessories || [],
      glassFormulas: normalizedProfile.glassFormulas || [],
      workshopOperations: normalizedProfile.workshopOperations || []
    })
    setProfileSimulationInput(createTechnicalSystemSimulationInput(normalizedProfile.systemType))
    setIsProfileModalOpen(true)
  }
  const handleSaveProfile = () => {
    const validation = validateTechnicalSystem(profileFormData, masterInventory)
    if (validation.errors.length > 0) {
      return alert(
        `لا يمكن حفظ النظام الفني قبل إكمال البيانات:\n- ${validation.errors.join('\n- ')}`
      )
    }

    const normalizedProfile = validation.normalized
    if (editingProfile)
      setProfiles((prev) =>
        prev.map((x) =>
          x.id === editingProfile.id ? { ...x, ...normalizedProfile, id: editingProfile.id } : x
        )
      )
    else setProfiles((prev) => [...prev, { ...normalizedProfile, id: Date.now() }])
    setIsProfileModalOpen(false)
  }

  const updateFormula = (id, field, value) => {
    setProfileFormData((prev) => ({
      ...prev,
      structuredFormulas: prev.structuredFormulas.map((f) =>
        f.id === id ? { ...f, [field]: value } : f
      )
    }))
  }
  const updateAccessory = (id, field, value) => {
    setProfileFormData((prev) => ({
      ...prev,
      accessories: prev.accessories.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    }))
  }
  const updateGlassFormula = (id, field, value) => {
    setProfileFormData((prev) => ({
      ...prev,
      glassFormulas: prev.glassFormulas.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    }))
  }
  const updateWorkshopOperation = (id, field, value) => {
    setProfileFormData((prev) => ({
      ...prev,
      workshopOperations: prev.workshopOperations.map((operation) =>
        operation.id === id ? { ...operation, [field]: value } : operation
      )
    }))
  }
  const updateProfilePhysics = (field, value) => {
    setProfileFormData((prev) => ({
      ...prev,
      physics: {
        ...defaultTechnicalSystemPhysics,
        ...(prev.physics || {}),
        [field]: value
      }
    }))
  }
  const updateProfileSimulationField = (field, value) => {
    setProfileSimulationInput((prev) => ({ ...prev, [field]: value }))
  }
  const updateProfileSimulationSection = (field, value) => {
    setProfileSimulationInput((prev) => ({
      ...prev,
      sections: [{ ...(prev.sections?.[0] || createDefaultWindowSection()), [field]: value }]
    }))
  }

  if (isCheckingLicense) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F4F7FE] p-4" dir="rtl">
        <div className="bg-white rounded-[2rem] p-10 shadow-2xl w-full max-w-md text-center border-t-8 border-[#4a6575]">
          <h1 className="text-2xl font-black text-[#314e60] mb-2">جاري فحص الترخيص</h1>
          <p className="text-gray-500 font-bold text-sm">يرجى الانتظار قليلاً...</p>
        </div>
      </div>
    )
  }

  if (!isActivated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F4F7FE] p-4" dir="rtl">
        <div className="bg-white rounded-[2rem] p-10 shadow-2xl w-full max-w-lg text-center border-t-8 border-[#4a6575]">
          <div className="w-20 h-20 bg-[#edf3f6] rounded-full flex items-center justify-center mx-auto mb-6 text-[#4a6575]">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-2xl font-black text-[#314e60] mb-2">
            تفعيل ألمنيوم برو (نظام الإنتاج)
          </h1>
          <p className="text-gray-500 font-bold text-sm mb-6">
            الرجاء تصوير هذا الرقم للحصول على كود التفعيل الخاص بك.
          </p>

          <div className="bg-[#edf3f6] p-4 rounded-xl mb-8 flex justify-between items-center border border-indigo-100">
            <div className="text-right">
              <span className="text-xs font-bold text-gray-500">رقم جهازك (HWID):</span>
              <p className="font-black text-xl text-[#4a6575] tracking-widest">
                {deviceHWID || 'جاري التحميل...'}
              </p>
            </div>
            <button
              disabled={!deviceHWID}
              onClick={() => {
                if (!deviceHWID) return
                navigator.clipboard.writeText(deviceHWID)
                alert('تم النسخ!')
              }}
              className="p-3 bg-white text-[#4a6575] rounded-lg shadow-sm hover:bg-[#eceff2] disabled:opacity-50"
            >
              <Copy size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#4a6575] font-black text-center text-lg tracking-wider"
              placeholder="أدخل كود التفعيل هنا..."
              value={licenseKey || ''}
              onChange={(e) => setLicenseKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleOfflineActivation()}
            />
            {activationError && (
              <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg border border-red-100">
                {activationError}
              </p>
            )}
            <button
              onClick={handleOfflineActivation}
              disabled={isLoadingActivation}
              className="w-full py-4 bg-[#4a6575] text-white rounded-xl font-black shadow-lg hover:bg-[#4a4387] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoadingActivation ? (
                'جاري فك التشفير والتفعيل...'
              ) : (
                <>
                  <KeyRound size={20} /> تفعيل البرنامج
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-8">
            نظام التفعيل الأوفلاين الآمن - الإصدار {APP_VERSION}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <AppShell
        appTitle="ألمنيوم برو"
        companyName={companySettings.name}
        companyLogo={companySettings.appIcon}
        activeTab={resolvedNavTab}
        activeLabel={currentNavItem?.label || 'مركز التشغيل'}
        activeDescription={
          currentNavItem?.description || 'واجهة تشغيل أبسط مبنية حول سير العمل الإنتاجي.'
        }
        navSections={filteredNavSections}
        onNavigate={handleNavigateHub}
        onReset={handleResetWorkspace}
        expiryDate={licenseExpiryDate}
        updateState={{
          updateAvailable,
          downloadProgress,
          updateReady,
          isDownloading,
          updateError
        }}
        onStartDownload={startDownload}
        onRestartAndInstall={restartAndInstall}
        systemMessage={systemMessage}
        onDismissSystemMessage={() => setSystemMessage(null)}
      >
        {activeTab === 'dashboard' && (
          <ProductionDashboard
            companyName={companySettings.name}
            savedProjects={savedProjects}
            dashboardStats={dashboardStats}
            neededPieces={neededPieces}
            neededGlass={neededGlass}
            neededAccessories={neededAccessories}
            financialSummary={financialSummary}
            productionOrder={productionOrderSnapshot}
            onOpenArchive={openExecutionHub}
            onOpenInventory={() => openMaterialsHub('inventory')}
            onOpenProject={() => openContractsHub('project')}
            onOpenProduction={() => openProductionHub('cutting')}
          />
        )}
        {/* ======================= بيانات المشروع ======================= */}
        {activeTab === 'project' && (
          <div className="space-y-4 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <section className="alu-panel-strong rounded-[1.8rem] px-5 py-5 md:px-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[var(--alu-brand-soft)] px-3 py-1 text-[11px] font-black text-[var(--alu-accent)]">
                    دورة العقد
                  </div>
                  <h2 className="mt-3 text-[1.4rem] font-black tracking-tight text-[var(--alu-text)]">
                    ملف العقد والتنفيذ المالي
                  </h2>
                  <p className="mt-2 max-w-3xl text-[13px] font-bold leading-6 text-[var(--alu-text-soft)]">
                    هنا تُبنى صورة العقد كاملة: بيانات العميل، البنود، قيمة التعاقد، الدفعات،
                    ومدى جاهزية الملف للانتقال إلى أمر الإنتاج.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {visibleContractHubTabs.map((tab) => {
                      const isActive = activeTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => openContractsHub(tab.id)}
                          className={`rounded-[1rem] border px-4 py-2.5 text-right transition-all ${
                            isActive
                              ? 'border-[rgba(85,104,255,0.22)] bg-[var(--alu-accent-soft)] text-[var(--alu-accent)] shadow-[0_10px_24px_rgba(85,104,255,0.08)]'
                              : 'border-[var(--alu-border)] bg-white text-[var(--alu-text-soft)] hover:border-[rgba(85,104,255,0.14)] hover:text-[var(--alu-text)]'
                          }`}
                        >
                          <div className="text-[12px] font-black">{tab.label}</div>
                          <div className="mt-1 text-[10px] font-bold leading-4 opacity-80">
                            {tab.helper}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1 xl:min-w-[20rem]">
                  <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                    <div className="text-[11px] font-black text-[var(--alu-text-soft)]">
                      اسم العميل
                    </div>
                    <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                      {projectInfo.clientName || 'لم يُحدد بعد'}
                    </div>
                  </div>
                  <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                    <div className="text-[11px] font-black text-[var(--alu-text-soft)]">
                      البنود المتفق عليها
                    </div>
                    <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                      {(projectInfo.contractItems?.length || 0).toLocaleString()} بند
                    </div>
                  </div>
                  <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                    <div className="text-[11px] font-black text-[var(--alu-text-soft)]">
                      قيمة العقد / المتبقي
                    </div>
                    <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                      {financialSummary.contractVal.toLocaleString()} ر.س
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-[var(--alu-text-soft)]">
                      المتبقي: {financialSummary.remainingBalance.toLocaleString()} ر.س
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-0 h-max">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-black text-[#314e60] flex items-center gap-2">
                    <Building /> بيانات المشروع (العقد والتسعير)
                  </h2>
                  {projectInfo.id && (
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">
                      محفوظ ضمن العقود والتنفيذ
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 px-1">اسم العميل</label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 bg-[#F4F7FE] text-[#314e60] rounded-2xl font-bold border-0 outline-none focus:ring-2 focus:ring-[#4a6575]"
                      value={projectInfo.clientName || ''}
                      onChange={(e) =>
                        setProjectInfo((prev) => ({ ...prev, clientName: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 px-1">رقم الجوال</label>
                    <input
                      type="tel"
                      className="w-full px-5 py-4 bg-[#F4F7FE] text-[#314e60] rounded-2xl font-bold border-0 outline-none focus:ring-2 focus:ring-[#4a6575]"
                      value={projectInfo.phone || ''}
                      onChange={(e) =>
                        setProjectInfo((prev) => ({ ...prev, phone: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="mt-8 mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-black text-[#314e60] flex items-center gap-2">
                      <Calculator size={18} /> تفاصيل البنود المتفق عليها
                    </h3>
                  </div>
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-gray-100 text-gray-500 font-bold border-b">
                        <tr>
                          <th className="p-3">اسم القطاع / النافذة</th>
                          <th className="p-3 w-20 text-center">العدد</th>
                          <th className="p-3 w-24 text-center">إجمالي (م²)</th>
                          <th className="p-3 w-24 text-center">سعر المتر</th>
                          <th className="p-3 w-28 text-center">الإجمالي</th>
                          <th className="p-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectInfo.contractItems.map((item) => (
                          <tr key={item.id} className="border-b last:border-0 bg-white">
                            <td className="p-2">
                              <div className="flex flex-col gap-1">
                                <select
                                  className="w-full px-2 py-1 bg-[#edf3f6] text-[#4a6575] rounded-lg outline-none font-bold text-xs border border-indigo-100"
                                  value={item.profileId || ''}
                                  onChange={(e) => {
                                    const prof = profiles.find(
                                      (p) => p.id === parseInt(e.target.value)
                                    )
                                    updateContractItem(
                                      item.id,
                                      'profileId',
                                      parseInt(e.target.value)
                                    )
                                    if (prof) updateContractItem(item.id, 'name', prof.name)
                                  }}
                                >
                                  <option value="">- اسحب من الكتالوج -</option>
                                  {profiles.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  placeholder="مسمى مخصص..."
                                  className="w-full px-3 py-1.5 bg-gray-50 rounded-lg outline-none font-bold text-sm"
                                  value={item.name}
                                  onChange={(e) =>
                                    updateContractItem(item.id, 'name', e.target.value)
                                  }
                                />
                              </div>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                className="w-full px-2 py-2 bg-gray-50 rounded-lg outline-none font-bold text-center"
                                value={item.qty}
                                onChange={(e) => updateContractItem(item.id, 'qty', e.target.value)}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                className="w-full px-2 py-2 bg-gray-50 rounded-lg outline-none font-bold text-center"
                                value={item.sqm}
                                onChange={(e) => updateContractItem(item.id, 'sqm', e.target.value)}
                              />
                            </td>
                            <td className="p-2 relative">
                              <input
                                type="text"
                                className="w-full px-2 py-2 bg-blue-50 text-blue-700 rounded-lg outline-none font-black text-center"
                                value={item.pricePerSqm}
                                onChange={(e) =>
                                  updateContractItem(item.id, 'pricePerSqm', e.target.value)
                                }
                              />
                            </td>
                            <td className="p-2 text-center font-black text-[#4a6575]">
                              {(
                                (parseArabicNum(item.qty) || 0) *
                                (parseArabicNum(item.sqm) || 0) *
                                (parseArabicNum(item.pricePerSqm) || 0)
                              ).toLocaleString()}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => removeContractItem(item.id)}
                                className="text-red-400 hover:text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="p-3 bg-gray-50 border-t flex justify-between items-center">
                      <button
                        onClick={addContractItem}
                        className="text-sm font-bold text-[#4a6575] flex items-center gap-1 hover:bg-[#edf3f6] px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Plus size={16} /> إضافة بند آخر
                      </button>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-[#4a6575] rounded"
                            checked={projectInfo.applyTax}
                            onChange={(e) =>
                              setProjectInfo((prev) => ({ ...prev, applyTax: e.target.checked }))
                            }
                          />
                          <span className="text-sm font-bold text-gray-600">تطبيق الضريبة</span>
                        </label>
                        {projectInfo.applyTax && (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              className="w-12 px-2 py-1 text-center bg-white border rounded-md font-bold text-sm outline-none"
                              value={projectInfo.taxRate}
                              onChange={(e) =>
                                setProjectInfo((prev) => ({ ...prev, taxRate: e.target.value }))
                              }
                            />
                            <span className="text-xs font-bold text-gray-500">%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </div>

                <div className="p-6 bg-[#edf3f6]/50 rounded-2xl border border-indigo-100 mb-8 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-gray-500">
                      إجمالي قيمة العقد (مع الضريبة)
                    </p>
                    <p className="text-3xl font-black text-[#4a6575] mt-1">
                      {financialSummary.contractVal.toLocaleString()}{' '}
                      <span className="text-sm">ر.س</span>
                    </p>
                  </div>
                  <div className="text-left border-r border-indigo-200 pr-6 pl-4">
                    <p className="text-xs font-bold text-gray-500 mb-2">الدفعات المسجلة</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-green-600">
                        {financialSummary.paidAmt.toLocaleString()}
                      </span>
                      <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="px-4 py-2 bg-[#4a6575] text-white rounded-xl text-xs font-bold hover:bg-[#4a4387]"
                      >
                        الدفعات
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={saveProject}
                    className={`flex-1 py-4 text-white rounded-2xl font-bold flex justify-center items-center gap-2 transition-all ${projectInfo.id ? 'bg-green-600 hover:bg-green-700' : 'bg-[#4a6575] hover:bg-[#4a4387]'}`}
                  >
                    {projectInfo.id ? <RefreshCw size={20} /> : <Save size={20} />}{' '}
                    {projectInfo.id ? 'تحديث وحفظ التعديلات' : 'اعتماد العقد وحفظ المشروع'}
                  </button>
                  <button
                    onClick={createNewProject}
                    className="px-6 py-4 bg-white border-2 border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50"
                    title="مشروع جديد"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="xl:col-span-1 space-y-6">
                <div className="bg-gradient-to-br from-[#314e60] to-[#1a2352] p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 opacity-10">
                    <PieChart size={180} />
                  </div>
                  <h3 className="text-white/70 font-bold text-sm mb-2">
                    إجمالي تكلفة المواد (BOM)
                  </h3>
                  <p className="text-4xl font-black mb-8">
                    {totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })} ر.س
                  </p>
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                      <div>
                        <p className="text-white/50 text-xs font-bold mb-1">
                          الربح المتوقع للمشروع
                        </p>
                        <p className="text-2xl font-black text-green-400">
                          {financialSummary.expectedProfit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-end pt-2">
                      <div>
                        <p className="text-white/50 text-xs font-bold mb-1">المتبقي من العميل</p>
                        <p className="text-xl font-black text-orange-300">
                          {financialSummary.remainingBalance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-1">إجمالي القطع المدرجة</p>
                    <p className="text-xl font-black text-[#314e60]">{neededPieces.length} قطعة</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Layers size={24} />
                  </div>
                </div>
              </div>
            </div>
            </div>
        )}

        {/* ======================= عرض السعر (للعميل) ======================= */}
        {activeTab === 'quotation' && (
          <WorkspaceSectionShell
            eyebrow="دورة العقد"
            title="عرض العميل والطباعة الرسمية"
            description="تحرير نسخة العرض التي تخرج للعميل، مع التحكم في الهوية البصرية والأعمدة والشروط قبل الطباعة أو الإرسال."
            tabs={visibleContractHubTabs}
            activeTab={activeTab}
            onChange={openContractsHub}
            summary={
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">
                    إجمالي العرض
                  </div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {quotationTotals.total.toLocaleString(undefined, {
                      maximumFractionDigits: 2
                    })}{' '}
                    ر.س
                  </div>
                </div>
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">
                    عدد السطور الظاهرة
                  </div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {(quoteItems || []).filter((item) => !item.isHidden).length.toLocaleString()} سطر
                  </div>
                </div>
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">
                    العميل
                  </div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {projectInfo.clientName || 'لم يُحدد بعد'}
                  </div>
                </div>
              </div>
            }
          >
            {(() => {
            const QUOTE_THEMES = [
              {
                id: 'blue',
                primary: '#314e60',
                secondary: '#4a6575',
                bg: '#F4F7FE',
                name: 'أزرق كلاسيكي'
              },
              {
                id: 'black',
                primary: '#111827',
                secondary: '#374151',
                bg: '#F3F4F6',
                name: 'أسود رسمي'
              },
              {
                id: 'green',
                primary: '#064E3B',
                secondary: '#047857',
                bg: '#ECFDF5',
                name: 'أخضر زمردي'
              },
              {
                id: 'red',
                primary: '#7F1D1D',
                secondary: '#B91C1C',
                bg: '#FEF2F2',
                name: 'أحمر قرمزي'
              },
              {
                id: 'gold',
                primary: '#78350F',
                secondary: '#B45309',
                bg: '#FFFBEB',
                name: 'ذهبي فاخر'
              }
            ]
            const currentTheme = quoteConfig?.theme || QUOTE_THEMES[0]
            const isEn = quoteConfig?.language === 'en'

              return (
              <div className="animate-in fade-in duration-500 max-w-6xl mx-auto space-y-6 print:max-w-full print:w-full print:m-0 print:p-0 print:space-y-0">
                <div className="bg-white rounded-[2rem] p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between print:hidden border border-gray-100">
                  <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                    <button
                      onClick={() => setQuoteInnerTab('editor')}
                      className={`px-6 py-2.5 rounded-lg font-black text-sm transition-all ${quoteInnerTab === 'editor' ? 'bg-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                      style={{ color: quoteInnerTab === 'editor' ? currentTheme.primary : '' }}
                    >
                      تعديل العرض
                    </button>
                    <button
                      onClick={() => setQuoteInnerTab('config')}
                      className={`px-6 py-2.5 rounded-lg font-black text-sm transition-all ${quoteInnerTab === 'config' ? 'bg-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                      style={{ color: quoteInnerTab === 'config' ? currentTheme.primary : '' }}
                    >
                      الضبط والتنسيق
                    </button>
                  </div>
                  {quoteInnerTab === 'editor' && (
                    <div className="flex gap-4">
                      <button
                        onClick={addQuoteItem}
                        className="px-5 py-2.5 text-white rounded-xl font-black flex gap-2 shadow-md transition-all active:scale-95"
                        style={{ backgroundColor: currentTheme.secondary }}
                      >
                        <Plus size={18} /> سطر جديد
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-black flex gap-2 hover:bg-green-700 shadow-md transition-all active:scale-95"
                      >
                        <Printer size={18} /> طباعة رسمية
                      </button>
                    </div>
                  )}
                </div>

                {quoteInnerTab === 'config' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
                    <div className="space-y-6">
                      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                        <h3
                          className="text-lg font-black mb-4 flex items-center gap-2"
                          style={{ color: currentTheme.primary }}
                        >
                          <Palette size={20} /> مظهر العرض واللغة
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500">
                              لغة العرض (Language)
                            </label>
                            <select
                              className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold outline-none border focus:border-gray-300"
                              value={quoteConfig?.language || 'ar'}
                              onChange={(e) =>
                                setQuoteConfig((prev) => ({ ...prev, language: e.target.value }))
                              }
                            >
                              <option value="ar">العربية (Arabic)</option>
                              <option value="en">English (الإنجليزية)</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500">
                              اللون الموحد (Theme)
                            </label>
                            <div className="flex gap-2 pt-2">
                              {QUOTE_THEMES.map((theme) => (
                                <button
                                  key={theme.id}
                                  onClick={() => setQuoteConfig((prev) => ({ ...prev, theme }))}
                                  className={`w-8 h-8 rounded-full border-2 transition-all ${currentTheme.id === theme.id ? 'scale-110 shadow-md border-gray-400' : 'border-transparent'}`}
                                  style={{ backgroundColor: theme.primary }}
                                  title={theme.name}
                                ></button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t">
                          <label className="text-sm font-bold text-gray-500">
                            العلامة المائية للورقة (صورة شفافة Watermark)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0]
                              if (file) {
                                const reader = new FileReader()
                                reader.onloadend = () =>
                                  setQuoteConfig((prev) => ({
                                    ...prev,
                                    watermark: reader.result
                                  }))
                                reader.readAsDataURL(file)
                              }
                            }}
                            className="w-full text-sm font-bold file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                          />
                          {quoteConfig?.watermark && (
                            <button
                              onClick={() =>
                                setQuoteConfig((prev) => ({ ...prev, watermark: null }))
                              }
                              className="text-red-500 text-xs font-bold mt-2 hover:underline"
                            >
                              إزالة العلامة المائية الحالية
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                        <h3
                          className="text-lg font-black mb-4"
                          style={{ color: currentTheme.primary }}
                        >
                          الأعمدة النشطة
                        </h3>
                        <div className="space-y-3 mb-6">
                          {(quoteConfig?.columns || []).map((col) => (
                            <div
                              key={col.id}
                              className="flex gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100"
                            >
                              <input
                                type="text"
                                value={col.label || ''}
                                onChange={(e) => updateQuoteColumn(col.id, 'label', e.target.value)}
                                className="flex-1 bg-white px-3 py-2 rounded-lg font-bold outline-none border focus:border-gray-300"
                              />
                              <button
                                onClick={() => updateQuoteColumn(col.id, 'visible', !col.visible)}
                                className={`p-2 rounded-lg font-bold text-sm w-20 transition-colors ${col.visible ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}
                              >
                                {col.visible ? 'إظهار' : 'إخفاء'}
                              </button>
                              {col.isCustom && (
                                <button
                                  onClick={() => deleteQuoteColumn(col.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={addQuoteColumn}
                          className="w-full py-3 border-2 border-dashed rounded-xl font-black transition-colors flex justify-center items-center gap-2 hover:bg-gray-50"
                          style={{
                            borderColor: currentTheme.secondary,
                            color: currentTheme.secondary
                          }}
                        >
                          <Plus size={18} /> إضافة عمود مخصص
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                        <h3
                          className="text-lg font-black mb-4"
                          style={{ color: currentTheme.primary }}
                        >
                          المالية والخصومات
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500">
                              نسبة الضريبة (%)
                            </label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 bg-gray-50 rounded-xl font-black text-center outline-none border focus:border-gray-300"
                              value={quoteConfig?.taxRate || ''}
                              onChange={(e) =>
                                setQuoteConfig((prev) => ({ ...prev, taxRate: e.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500">
                              خصم إضافي (مبلغ)
                            </label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 bg-gray-50 rounded-xl font-black text-center outline-none border focus:border-gray-300"
                              value={quoteConfig?.discount || ''}
                              onChange={(e) =>
                                setQuoteConfig((prev) => ({ ...prev, discount: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                        <h3
                          className="text-lg font-black mb-4"
                          style={{ color: currentTheme.primary }}
                        >
                          الشروط والأحكام (تظهر أسفل العرض)
                        </h3>
                        <textarea
                          className="w-full px-4 py-3 bg-gray-50 text-gray-700 border border-gray-200 outline-none rounded-xl font-bold min-h-[120px] resize-y focus:border-gray-300"
                          value={
                            quoteConfig?.notes ??
                            (isEn
                              ? 'Prices are subject to review.'
                              : 'الأسعار أعلاه خاضعة للمراجعة.')
                          }
                          onChange={(e) =>
                            setQuoteConfig((prev) => ({ ...prev, notes: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className={`bg-white rounded-[2rem] p-8 md:p-12 shadow-md border border-gray-200 min-h-[1050px] relative overflow-hidden ${quoteInnerTab === 'config' ? 'hidden print:block' : 'block'} print:shadow-none print:border-none print:m-0 print:p-0 print:w-full print:min-h-0 print:overflow-visible print:rounded-none`}
                  style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                  dir={isEn ? 'ltr' : 'rtl'}
                >
                  {quoteConfig?.watermark && (
                    <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10 print:opacity-[0.15] pointer-events-none select-none">
                      <img
                        src={quoteConfig.watermark}
                        className="max-w-[80%] max-h-[80%] object-contain"
                        alt="Watermark"
                      />
                    </div>
                  )}

                  <div className="relative z-10">
                    <div
                      className="grid grid-cols-3 items-start border-b-4 pb-6 mb-8"
                      style={{ borderColor: currentTheme.primary }}
                    >
                      <div className="flex flex-col gap-2">
                        {companySettings.logo ? (
                          <img
                            src={companySettings.logo}
                            alt="شعار"
                            className="max-h-20 max-w-[180px] object-contain"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 print:hidden">
                            <ImageIcon size={32} />
                          </div>
                        )}
                        <div>
                          <h1
                            className="text-xl font-black tracking-tight"
                            style={{ color: currentTheme.primary }}
                          >
                            {companySettings.name}
                          </h1>
                          <div className="text-[10px] font-bold text-gray-500 space-y-1">
                            {companySettings.address && <p>{companySettings.address}</p>}
                            {companySettings.phone && (
                              <p dir="ltr" className={isEn ? 'text-left' : 'text-right'}>
                                {companySettings.phone}
                              </p>
                            )}
                            {(companySettings.crNumber || companySettings.taxNumber) && (
                              <div className="pt-1 mt-1 border-t border-gray-200">
                                {companySettings.crNumber && (
                                  <p>
                                    {isEn ? 'C.R:' : 'س.ت:'} {companySettings.crNumber}
                                  </p>
                                )}
                                {companySettings.taxNumber && (
                                  <p>
                                    {isEn ? 'VAT No:' : 'الرقم الضريبي:'}{' '}
                                    {companySettings.taxNumber}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center h-full pt-4">
                        <input
                          type="text"
                          value={
                            quoteConfig?.title !== undefined
                              ? quoteConfig.title
                              : isEn
                                ? 'QUOTATION'
                                : 'عرض سعر'
                          }
                          onChange={(e) =>
                            setQuoteConfig((prev) => ({ ...prev, title: e.target.value }))
                          }
                          className="text-3xl md:text-4xl font-black tracking-widest bg-transparent outline-none text-center w-full focus:bg-gray-50 rounded-lg"
                          style={{ color: currentTheme.primary }}
                        />
                      </div>

                      <div
                        className={`text-sm font-bold text-gray-600 ${isEn ? 'text-right' : 'text-left'}`}
                      >
                        <table className={`ml-auto ${isEn ? 'mr-0 ml-auto' : 'mr-auto ml-0'}`}>
                          <tbody>
                            <tr>
                              <td className={`py-1 ${isEn ? 'pr-4' : 'pl-4'}`}>
                                {isEn ? 'Date:' : 'التاريخ:'}
                              </td>
                              <td className="py-1">
                                <input
                                  type="text"
                                  value={quoteConfig?.quoteDate || ''}
                                  onChange={(e) =>
                                    setQuoteConfig((prev) => ({
                                      ...prev,
                                      quoteDate: e.target.value
                                    }))
                                  }
                                  className="w-24 bg-transparent outline-none font-black print:hidden"
                                  style={{ color: currentTheme.primary }}
                                />
                                <span
                                  className="hidden print:inline-block font-black"
                                  style={{ color: currentTheme.primary }}
                                >
                                  {quoteConfig?.quoteDate}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td className={`py-1 ${isEn ? 'pr-4' : 'pl-4'}`}>
                                {isEn ? 'Quote No:' : 'رقم العرض:'}
                              </td>
                              <td
                                className="py-1 font-black"
                                dir="ltr"
                                style={{ color: currentTheme.primary }}
                              >
                                QT-
                                {projectInfo.id ? String(projectInfo.id).slice(-6) : '000000'}
                              </td>
                            </tr>
                            <tr>
                              <td className={`py-1 ${isEn ? 'pr-4' : 'pl-4'}`}>
                                {isEn ? 'Validity:' : 'صلاحية العرض:'}
                              </td>
                              <td className="py-1">
                                <input
                                  type="text"
                                  value={quoteConfig?.validity ?? (isEn ? '15 Days' : '15 يوماً')}
                                  onChange={(e) =>
                                    setQuoteConfig((prev) => ({
                                      ...prev,
                                      validity: e.target.value
                                    }))
                                  }
                                  className="w-24 bg-transparent outline-none font-black border-b border-transparent focus:border-gray-300 print:hidden"
                                  style={{ color: currentTheme.primary }}
                                />
                                <span
                                  className="hidden print:inline-block font-black"
                                  style={{ color: currentTheme.primary }}
                                >
                                  {quoteConfig?.validity ?? (isEn ? '15 Days' : '15 يوماً')}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div
                      className="border border-gray-200 rounded-2xl p-5 mb-6 relative overflow-hidden"
                      style={{ backgroundColor: currentTheme.bg }}
                    >
                      <div
                        className={`absolute top-0 ${isEn ? 'left-0' : 'right-0'} w-1.5 h-full`}
                        style={{ backgroundColor: currentTheme.primary }}
                      ></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <span className="w-28 text-sm font-black text-gray-500">
                            {isEn ? 'M/S :' : 'السادة /'}
                          </span>
                          <input
                            type="text"
                            value={projectInfo?.clientName || ''}
                            onChange={(e) =>
                              setProjectInfo((prev) => ({ ...prev, clientName: e.target.value }))
                            }
                            className="flex-1 bg-transparent outline-none font-black text-lg border-b border-dashed border-gray-300 print:hidden focus:border-gray-400"
                            style={{ color: currentTheme.primary }}
                            placeholder={isEn ? 'Client Name...' : 'اسم العميل أو الشركة...'}
                          />
                          <span
                            className="hidden print:block font-black text-lg flex-1 pb-1 border-b border-dashed border-gray-400"
                            style={{ color: currentTheme.primary }}
                          >
                            {projectInfo?.clientName ||
                              '...........................................'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-28 text-sm font-black text-gray-500">
                            {isEn ? 'Attn :' : 'عناية السيد /'}
                          </span>
                          <input
                            type="text"
                            className="flex-1 bg-transparent outline-none font-black text-base border-b border-dashed border-gray-300 print:hidden focus:border-gray-400"
                            style={{ color: currentTheme.primary }}
                            placeholder={isEn ? 'Contact Person...' : 'الشخص المعني...'}
                          />
                          <span
                            className="hidden print:block font-black text-base flex-1 pb-1 border-b border-dashed border-gray-400"
                            style={{ color: currentTheme.primary }}
                          >
                            ...........................................
                          </span>
                        </div>
                        <div className="flex items-center gap-3 md:col-span-2">
                          <span className="w-28 text-sm font-black text-gray-500">
                            {isEn ? 'Project :' : 'المشروع /'}
                          </span>
                          <input
                            type="text"
                            className="flex-1 bg-transparent outline-none font-black text-base border-b border-dashed border-gray-300 print:hidden focus:border-gray-400"
                            style={{ color: currentTheme.primary }}
                            placeholder={isEn ? 'Project Name...' : 'وصف أو موقع المشروع...'}
                          />
                          <span
                            className="hidden print:block font-black text-base flex-1 pb-1 border-b border-dashed border-gray-400"
                            style={{ color: currentTheme.primary }}
                          >
                            .......................................................................................
                          </span>
                        </div>
                      </div>
                    </div>

                    <textarea
                      className="w-full bg-transparent font-bold text-gray-600 mb-4 text-sm leading-relaxed resize-none outline-none border-b border-transparent focus:border-gray-200 overflow-hidden"
                      value={
                        quoteConfig?.introText ??
                        (isEn
                          ? 'Dear Sir,\nBased on your request, we are pleased to submit our quotation for supplying and installing aluminum works as per the specifications below:'
                          : 'تحية طيبة وبعد،،،\nبناءً على طلبكم، يسعدنا أن نقدم لكم عرض السعر التالي لتوريد وتركيب أعمال الألمنيوم حسب المواصفات الموضحة أدناه:')
                      }
                      onChange={(e) => {
                        e.target.style.height = 'auto'
                        e.target.style.height = e.target.scrollHeight + 'px'
                        setQuoteConfig((prev) => ({ ...prev, introText: e.target.value }))
                      }}
                      onFocus={(e) => {
                        e.target.style.height = 'auto'
                        e.target.style.height = e.target.scrollHeight + 'px'
                      }}
                    />

                    <div
                      className="rounded-2xl overflow-hidden border-2 mb-8 bg-white/80"
                      style={{ borderColor: currentTheme.primary }}
                    >
                      <table
                        className={`w-full border-collapse ${isEn ? 'text-left' : 'text-right'}`}
                      >
                        <thead
                          className="text-white"
                          style={{ backgroundColor: currentTheme.primary }}
                        >
                          <tr>
                            <th
                              className={`p-3 w-12 text-center font-black border-white/20 ${isEn ? 'border-r' : 'border-l'}`}
                            >
                              {isEn ? 'S.N' : 'م'}
                            </th>
                            {(quoteConfig?.columns || [])
                              .filter((c) => c.visible)
                              .map((col) => (
                                <th
                                  key={col.id}
                                  className={`p-3 font-black border-white/20 ${isEn ? 'border-r' : 'border-l'}`}
                                >
                                  {col.label}
                                </th>
                              ))}
                            <th
                              className={`p-3 w-32 text-center font-black border-white/20 ${isEn ? 'border-r' : 'border-l'}`}
                            >
                              {isEn ? 'Total (SAR)' : 'الإجمالي (ر.س)'}
                            </th>
                            <th className="w-12 print:hidden"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(quoteItems || []).map((item, index) => {
                            if (item.isHidden && document.body.classList.contains('print-wrapper'))
                              return null
                            const total =
                              (parseArabicNum(item.col_qty) || 0) *
                              (parseArabicNum(item.col_price) || 0)
                            return (
                              <tr
                                key={item.id}
                                className={`border-b border-gray-200 ${item.isHidden ? 'opacity-40 bg-gray-50 print:hidden' : 'bg-transparent'}`}
                              >
                                <td
                                  className={`p-3 text-center text-gray-500 font-black border-gray-200 bg-gray-50 print:bg-transparent ${isEn ? 'border-r' : 'border-l'}`}
                                >
                                  {index + 1}
                                </td>
                                {(quoteConfig?.columns || [])
                                  .filter((c) => c.visible)
                                  .map((col) => (
                                    <td
                                      key={col.id}
                                      className={`p-3 border-gray-200 relative group ${isEn ? 'border-r' : 'border-l'}`}
                                    >
                                      <textarea
                                        rows={1}
                                        value={item[col.id] || ''}
                                        onChange={(e) => {
                                          e.target.style.height = 'auto'
                                          e.target.style.height = e.target.scrollHeight + 'px'
                                          updateQuoteItem(item.id, col.id, e.target.value)
                                        }}
                                        className="w-full bg-transparent outline-none font-bold resize-none print:hidden overflow-hidden text-gray-800 leading-relaxed"
                                        placeholder="..."
                                      />
                                      <div className="hidden print:block font-bold whitespace-pre-wrap text-black leading-relaxed">
                                        {item[col.id]}
                                      </div>
                                    </td>
                                  ))}
                                <td
                                  className={`p-3 text-center font-black border-gray-200 print:bg-transparent ${isEn ? 'border-r' : 'border-l'}`}
                                  style={{
                                    color: currentTheme.primary,
                                    backgroundColor: currentTheme.bg
                                  }}
                                >
                                  {total > 0 ? total.toLocaleString() : '-'}
                                </td>
                                <td className="p-2 print:hidden flex flex-col gap-1 justify-center items-center h-full">
                                  <button
                                    onClick={() =>
                                      updateQuoteItem(item.id, 'isHidden', !item.isHidden)
                                    }
                                    className={`p-1.5 rounded-md ${item.isHidden ? 'bg-gray-200 text-gray-500' : 'bg-[#e6edf2] text-blue-600'} hover:bg-opacity-80 transition-colors`}
                                    title="إظهار/إخفاء في الطباعة"
                                  >
                                    {item.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                                  </button>
                                  <button
                                    onClick={() => removeQuoteItem(item.id)}
                                    className="p-1.5 rounded-md bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                    title="حذف السطر"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 mt-8 page-break-inside-avoid">
                      <div className="flex-1">
                        {quoteConfig?.notes && (
                          <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200 print:bg-transparent print:border-none print:p-0">
                            <h4
                              className="font-black text-sm mb-3 flex items-center gap-2"
                              style={{ color: currentTheme.primary }}
                            >
                              <CheckCircle size={16} className="print:hidden" />
                              {isEn ? 'Terms & Conditions:' : 'الشروط والأحكام:'}
                            </h4>
                            <textarea
                              className="w-full bg-transparent font-bold text-sm text-gray-600 print:text-gray-800 whitespace-pre-wrap leading-relaxed outline-none resize-none overflow-hidden print:overflow-visible"
                              value={quoteConfig.notes}
                              onChange={(e) => {
                                e.target.style.height = 'auto'
                                e.target.style.height = e.target.scrollHeight + 'px'
                                setQuoteConfig((prev) => ({ ...prev, notes: e.target.value }))
                              }}
                              onFocus={(e) => {
                                e.target.style.height = 'auto'
                                e.target.style.height = e.target.scrollHeight + 'px'
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div
                        className="w-full md:w-80 shrink-0 border-2 rounded-2xl overflow-hidden h-max bg-white/90"
                        style={{ borderColor: currentTheme.primary }}
                      >
                        <div
                          className="text-white p-3 text-center"
                          style={{ backgroundColor: currentTheme.primary }}
                        >
                          <h4 className="font-black">{isEn ? 'Summary' : 'ملخص التكاليف'}</h4>
                        </div>
                        <div className="p-5 space-y-3">
                          <div className="flex justify-between text-sm font-bold text-gray-600 print:text-gray-800">
                            <span>{isEn ? 'Subtotal:' : 'المجموع الفرعي:'}</span>
                            <span className="font-black text-black">
                              {quotationTotals.subtotal.toLocaleString()}
                            </span>
                          </div>
                          {quotationTotals.discount > 0 && (
                            <div className="flex justify-between text-sm font-bold text-red-600">
                              <span>{isEn ? 'Discount:' : 'الخصم:'}</span>
                              <span className="font-black">
                                {quotationTotals.discount.toLocaleString()}-
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-bold text-gray-600 print:text-gray-800 pb-3 border-b border-gray-200">
                            <span>
                              {isEn
                                ? `VAT (${quoteConfig?.taxRate || 0}%):`
                                : `الضريبة (${quoteConfig?.taxRate || 0}%):`}
                            </span>
                            <span className="font-black text-black">
                              {quotationTotals.tax.toLocaleString(undefined, {
                                maximumFractionDigits: 2
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span
                              className="font-black text-lg"
                              style={{ color: currentTheme.primary }}
                            >
                              {isEn ? 'Total:' : 'الإجمالي الكلي:'}
                            </span>
                            <span className="font-black text-2xl text-green-600 print:text-black">
                              {quotationTotals.total.toLocaleString(undefined, {
                                maximumFractionDigits: 2
                              })}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 text-center mt-2">
                            {isEn ? 'All amounts in SAR' : 'جميع المبالغ بالريال السعودي'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-20 flex justify-around text-center border-t-2 border-gray-100 print:border-gray-300 pt-10 page-break-inside-avoid">
                      <div className="w-1/3">
                        <p
                          className="font-black mb-16 text-lg"
                          style={{ color: currentTheme.primary }}
                        >
                          {isEn ? 'Sales Representative' : 'مندوب المبيعات'}
                        </p>
                        <p className="border-t border-dashed border-gray-400 mx-8 pt-2 font-bold text-xs text-gray-500">
                          {isEn ? 'Sign / Name' : 'الاسم / التوقيع'}
                        </p>
                      </div>
                      <div className="w-1/3">
                        <p
                          className="font-black mb-16 text-lg"
                          style={{ color: currentTheme.primary }}
                        >
                          {isEn ? 'Company Stamp' : 'ختم المؤسسة'}
                        </p>
                        <p className="border-t border-dashed border-gray-400 mx-8 pt-2 font-bold text-xs text-gray-500">
                          {isEn ? 'Official Stamp' : 'الختم الرسمي'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )
            })()}
          </WorkspaceSectionShell>
        )}

        {/* ======================= مقايسة جديدة (المقاسات) ======================= */}
        {activeTab === 'cutting' && (
          <WorkspaceSectionShell
            eyebrow="أمر الإنتاج"
            title="الإنتاج والقص والربط الفوري بالمخزون"
            description="هذه مساحة العمل التنفيذية الحقيقية: إدخال المقاسات، استخراج المواد، مراجعة النواقص، ثم الانتقال المباشر إلى تقارير الورشة أو قص الزجاج من نفس المركز."
            tabs={visibleProductionHubTabs}
            activeTab={activeTab}
            onChange={openProductionHub}
            summary={
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">
                    القطع المعتمدة
                  </div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {productionOrderSnapshot.queue.pieceLines.toLocaleString()} بند قص
                  </div>
                </div>
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">
                    مجموعات الأعواد
                  </div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {productionOrderSnapshot.cutting.profileGroups.toLocaleString()} قطاع
                  </div>
                </div>
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">
                    نواقص الشراء الحالية
                  </div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {productionOrderSnapshot.procurement.shortageLinesCount.toLocaleString()} بند
                  </div>
                </div>
              </div>
            }
          >
            <ProductionCuttingWorkspace
              projectInfo={projectInfo}
              setProjectInfo={setProjectInfo}
              savedProjects={contractProjects}
              onLinkToContract={handleLinkToContract}
              isContractLinked={isCurrentContractLinked}
              inventoryAlerts={inventoryAlerts}
              onUseLeftover={(leftoverId) =>
                setLeftovers((prev) => prev.filter((leftover) => leftover.id !== leftoverId))
              }
              inputMode={inputMode}
              setInputMode={setInputMode}
              onImportFile={handleImportFile}
              mainSystemId={mainSystemId}
              setMainSystemId={setMainSystemId}
              profiles={profiles}
              windowInput={windowInput}
              setWindowInput={setWindowInput}
              addSmartWindow={addSmartWindow}
              previewPieces={previewPieces}
              neededPieces={neededPieces}
              setNeededPieces={setNeededPieces}
              neededGlass={neededGlass}
              aggregatedAccessories={aggregatedAccessories}
              aggregatedOperations={aggregatedOperations}
              currentProjectResults={currentProjectResults}
              rawCosts={rawCosts}
              totalCost={totalCost}
              financialSummary={productionFinancialSummary}
              productionOrder={productionOrderSnapshot}
              saveProject={saveProject}
              masterInventory={masterInventory}
              onAssemblySave={(pieces, glass, accs, ops = []) => {
                const inserted = appendProductionBatch({
                  pieces,
                  glass,
                  accessories: accs,
                  operations: ops
                })
                if (!inserted) {
                  return alert('⚠️ لم تنتج التجميعة أي مواد فعلية. راجع الأنظمة الفنية والوحدات.')
                }
                setInputMode('window')
                alert('✅ تم إدراج التجميعة الذكية وربطها بأمر الإنتاج بنجاح!')
              }}
              onVisualSave={(pieces, glass, accs, ops = []) => {
                const inserted = appendProductionBatch(
                  {
                    pieces,
                    glass,
                    accessories: accs,
                    operations: ops
                  },
                  {
                    requirePieces: true,
                    emptyAlert: '⚠️ لم ينتج أي قطع! تأكد من الكتالوج والرسم.'
                  }
                )
                if (!inserted) return
                setInputMode('window')
                alert('✅ تم تحويل الرسم إلى مقاسات فعلية وإدراجها في المقايسة بنجاح!')
              }}
            />
          </WorkspaceSectionShell>
        )}
        {activeTab === 'cutting-legacy' && (
          <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-xl font-black text-[#314e60] mb-4 flex items-center gap-2">
                <Frame size={20} /> تفاصيل المقايسة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">
                    اسم صاحب المقايسة / العميل
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl font-bold outline-none focus:border-[#4a6575] border border-transparent"
                    placeholder="أدخل اسم العميل..."
                    value={projectInfo.clientName || ''}
                    onChange={(e) =>
                      setProjectInfo((prev) => ({ ...prev, clientName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">
                    ربط المقايسة بعقد محفوظ (اختياري)
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl font-bold outline-none border border-transparent focus:border-[#4a6575]"
                    value={projectInfo.id || ''}
                    onChange={(e) => handleLinkToContract(e.target.value)}
                  >
                    <option value="">بدون عقد (مقايسة حرة)</option>
                    {savedProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        عقد: {p.info.clientName} - {p.info.date}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {projectInfo.id &&
              projectInfo.contractItems &&
              projectInfo.contractItems.length > 0 &&
              projectInfo.contractItems[0].name && (
                <div className="bg-[#edf3f6] border border-indigo-200 rounded-3xl p-6 mb-6 shadow-inner">
                  <h4 className="font-black text-[#314e60] mb-4 flex items-center gap-2">
                    <ListChecks size={20} /> بنود العقد (اضغط على البند لإدخال مقاساته):
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {projectInfo.contractItems.map((cItem) => (
                      <button
                        key={cItem.id}
                        onClick={() => {
                          if (cItem.profileId) {
                            setMainSystemId(String(cItem.profileId))
                          } else {
                            alert(
                              '⚠️ هذا البند قديم أو لم يتم اختيار قطاعه في العقد!\nالرجاء العودة لشاشة "العقد" وتحديد القطاع من القائمة المنسدلة لهذا البند أولاً.'
                            )
                            return
                          }
                          setWindowInput((prev) => ({
                            ...prev,
                            label: cItem.name,
                            quantity: cItem.qty || '1'
                          }))
                        }}
                        className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-indigo-200 hover:bg-[#4a6575] hover:text-white transition-all font-bold text-sm flex flex-col items-start gap-2 group focus:ring-4 focus:ring-indigo-300"
                      >
                        <span className="text-base">{cItem.name}</span>
                        <span className="text-xs text-gray-500 group-hover:text-indigo-200">
                          الكمية: {cItem.qty} | الإجمالي: {cItem.sqm}م²
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            {inventoryAlerts.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl space-y-2 shadow-sm animate-pulse">
                <h4 className="font-black text-red-700 flex items-center gap-2">
                  <AlertCircle size={18} /> تنبيه حماية المخزون!
                </h4>
                {inventoryAlerts.map((alert, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-red-800 font-bold text-sm bg-white p-2 rounded-lg border border-red-100"
                  >
                    <span>{alert.msg}</span>
                    <button
                      onClick={() =>
                        setLeftovers((prev) => prev.filter((l) => l.id !== alert.leftoverId))
                      }
                      className="px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded-md text-xs font-black transition-colors"
                    >
                      استخدمت الفضلة
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap bg-white p-2 rounded-2xl shadow-sm w-max gap-2 border mb-6">
              <button
                onClick={() => setInputMode('window')}
                className={`px-6 py-3 rounded-xl text-sm font-bold flex gap-2 transition-all ${inputMode === 'window' ? 'bg-[#4a6575] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Frame size={16} /> النوافذ والأبواب
              </button>
              <button
                onClick={() => setInputMode('visual')}
                className={`px-6 py-3 rounded-xl text-sm font-bold flex gap-2 transition-all ${inputMode === 'visual' ? 'bg-[#b89466] text-white shadow-md border-[#a98556]' : 'text-gray-500 hover:bg-[#fbf4ea] hover:text-[#a98556] border border-transparent'}`}
                title="نظام الواجهات المرئي"
              >
                <Layout size={16} /> الرسم المرئي للواجهات
              </button>
              <div className="relative border-r pr-2 pl-2">
                <input
                  type="file"
                  id="import-file"
                  accept=".alu,.json"
                  className="hidden"
                  onChange={handleImportFile}
                />
                <label
                  htmlFor="import-file"
                  className="cursor-pointer px-6 py-3 bg-green-500 text-white rounded-xl text-sm font-bold flex gap-2 hover:bg-green-600"
                >
                  <FileJson size={18} /> استيراد بيانات
                </label>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm">
              {inputMode === 'window' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="bg-[#edf3f6]/50 p-6 rounded-2xl">
                      <label className="text-xs font-bold text-[#4a6575] mb-2 block">القطاع</label>
                      {projectInfo.id ? (
                        <div className="w-full px-4 py-3 bg-white/50 rounded-xl font-black text-gray-500 border border-gray-200 flex justify-between items-center">
                          <span>
                            {mainSystemId
                              ? profiles.find((p) => p.id === parseInt(mainSystemId))?.name ||
                                'قطاع غير معروف'
                              : 'يرجى الضغط على أحد بنود العقد أعلاه 👆'}
                          </span>
                          <span className="text-[10px] bg-[#eceff2] text-[#4a6575] px-2 py-1 rounded-md">
                            مربوط بالعقد
                          </span>
                        </div>
                      ) : (
                        <select
                          value={mainSystemId}
                          onChange={(e) => setMainSystemId(e.target.value)}
                          className="w-full px-4 py-3 bg-white rounded-xl font-black outline-none border border-transparent focus:border-[#4a6575]"
                        >
                          <option value="">- اختر القطاع يدوياً -</option>
                          {profiles.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-400">العرض الكلي (م)</label>
                        <input
                          type="text"
                          className="w-full px-5 py-4 bg-[#F4F7FE] rounded-2xl font-bold text-center"
                          value={windowInput.width || ''}
                          onChange={(e) =>
                            setWindowInput((prev) => ({ ...prev, width: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400">
                          الارتفاع الكلي (م)
                        </label>
                        <input
                          type="text"
                          className="w-full px-5 py-4 bg-[#F4F7FE] rounded-2xl font-bold text-center"
                          value={windowInput.height || ''}
                          onChange={(e) =>
                            setWindowInput((prev) => ({ ...prev, height: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-inner">
                      <label className="flex items-center gap-3 cursor-pointer font-black text-[#4a6575] mb-4">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded accent-[#4a6575]"
                          checked={windowInput.isComplex}
                          onChange={(e) =>
                            setWindowInput((prev) => ({ ...prev, isComplex: e.target.checked }))
                          }
                        />
                        نافذة مقسمة (قاطع أفقي + دمج أنظمة)
                      </label>

                      {windowInput.isComplex && (
                        <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2 p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-400">
                              حدد نوع كل مقطع وارتفاعه (اترك ارتفاع قسم واحد فارغاً ليحسبه
                              البرنامج):
                            </p>
                            {(windowInput.sections || []).map((sec, i) => (
                              <div
                                key={sec.id}
                                className="p-3 bg-[#edf3f6]/50 rounded-lg border border-indigo-100 relative"
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-black text-[#314e60]">
                                    القسم {i + 1}
                                  </span>
                                  {(windowInput.sections || []).length > 2 && (
                                    <button
                                      onClick={() =>
                                        setWindowInput((prev) => ({
                                          ...prev,
                                          sections: prev.sections.filter((s) => s.id !== sec.id)
                                        }))
                                      }
                                      className="text-red-400 hover:text-red-600 bg-white p-1 rounded-md shadow-sm"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="الارتفاع (م)"
                                    className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-lg font-black text-center text-sm outline-none focus:border-[#4a6575]"
                                    value={sec.h ?? ''}
                                    onChange={(e) => {
                                      const newSecs = [...windowInput.sections]
                                      newSecs[i] = { ...newSecs[i], h: e.target.value }
                                      setWindowInput((prev) => ({ ...prev, sections: newSecs }))
                                    }}
                                  />
                                  <select
                                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg font-bold text-sm outline-none focus:border-[#4a6575]"
                                    value={sec.type ?? 'sash'}
                                    onChange={(e) => {
                                      const newSecs = [...windowInput.sections]
                                      newSecs[i] = { ...newSecs[i], type: e.target.value }
                                      setWindowInput((prev) => ({ ...prev, sections: newSecs }))
                                    }}
                                  >
                                    <option value="fixed">قسم ثابت (زجاج فقط)</option>
                                    <option value="sash">قسم متحرك (درفة/مفصلي/سحاب)</option>
                                  </select>
                                </div>
                              </div>
                            ))}
                            <button
                              onClick={() =>
                                setWindowInput((prev) => ({
                                  ...prev,
                                  sections: [
                                    ...(windowInput.sections || []),
                                    createDefaultWindowSection(Date.now())
                                  ]
                                }))
                              }
                              className="w-full py-3 mt-2 border-2 border-dashed border-[#4a6575]/40 text-[#4a6575] rounded-xl font-black flex justify-center items-center gap-2 hover:bg-[#edf3f6] transition-all"
                            >
                              <Plus size={18} /> إضافة قسم جديد
                            </button>
                          </div>
                        </div>
                      )}

                      {!windowInput.isComplex && (
                        <div className="mt-4 mb-4 bg-[#edf3f6]/50 p-4 rounded-xl border border-indigo-100">
                          <label className="text-xs font-bold text-[#4a6575] block mb-2">
                            طبيعة هذه النافذة (ليفرز البرنامج المعادلات)
                          </label>
                          <select
                            className="w-full px-4 py-3 bg-white rounded-xl font-black outline-none focus:border-[#4a6575] border border-gray-200"
                            value={windowInput.sections?.[0]?.type || 'sash'}
                            onChange={(e) => {
                              const newSecs = [...(windowInput.sections || [{ id: 1 }])]
                              newSecs[0] = { ...newSecs[0], type: e.target.value }
                              setWindowInput((prev) => ({ ...prev, sections: newSecs }))
                            }}
                          >
                            <option value="sash">نافذة متحركة (سحاب / مفصلي)</option>
                            <option value="fixed">نافذة ثابتة (زجاج فقط)</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-400">الكمية</label>
                        <input
                          type="text"
                          className="w-full px-5 py-4 bg-[#F4F7FE] rounded-2xl font-bold text-center"
                          value={windowInput.quantity || ''}
                          onChange={(e) =>
                            setWindowInput((prev) => ({ ...prev, quantity: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400">المسمى</label>
                        <input
                          type="text"
                          className="w-full px-5 py-4 bg-[#F4F7FE] rounded-2xl font-bold text-center"
                          value={windowInput.label || ''}
                          onChange={(e) =>
                            setWindowInput((prev) => ({ ...prev, label: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <button
                      onClick={addSmartWindow}
                      className="w-full py-4 bg-[#4a6575] text-white rounded-2xl font-black text-lg flex justify-center gap-3 hover:bg-[#4a4387]"
                    >
                      <Scissors size={22} /> إدراج للمقايسة
                    </button>
                  </div>

                  <div className="bg-[#F4F7FE] rounded-3xl p-6 border-2 border-dashed overflow-y-auto max-h-[700px]">
                    {windowInput.width && windowInput.height && mainSystemId ? (
                      <div className="bg-white rounded-2xl p-4 space-y-4">
                        <h4 className="text-xs font-black text-center mb-2">الاستهلاك والتقسيم</h4>
                        {previewPieces.map((p) => (
                          <div
                            key={p.tempId}
                            className="flex justify-between items-center font-bold p-2.5 bg-gray-50 rounded-lg"
                          >
                            <span className="text-xs w-3/4 leading-snug">
                              {String(p.label).replace(windowInput.label + ' - ', '')}
                            </span>
                            <span className="text-[#4a6575] whitespace-nowrap">{p.length} م</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                        <Frame size={48} />
                        <span className="font-bold text-sm mt-3">اختر القطاع للبدء</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {inputMode === 'visual' && (
                <VisualDesigner
                  profiles={profiles}
                  inventory={masterInventory}
                  onSave={(pieces, glass, accs) => {
                    const inserted = appendProductionBatch(
                      {
                        pieces,
                        glass,
                        accessories: accs
                      },
                      {
                        requirePieces: true,
                        emptyAlert: '⚠️ لم ينتج أي قطع! تأكد من الكتالوج والرسم.'
                      }
                    )
                    if (!inserted) return
                    setInputMode('window')
                    alert('✅ تم تحويل الرسم إلى مقاسات فعلية وإدراجها في المقايسة بنجاح!')
                  }}
                />
              )}
            </div>

            {neededPieces.length > 0 && (
              <div className="bg-white rounded-[2rem] p-8 shadow-sm">
                <div className="flex gap-3 p-4 bg-[#4a6575] text-white font-bold rounded-t-2xl">
                  <ListChecks size={20} /> القطع المعتمدة للمقايسة
                </div>
                <table className="w-full text-right text-sm">
                  <thead className="bg-[#F4F7FE] text-gray-500 font-bold">
                    <tr>
                      <th className="p-4">النافذة والتفاصيل</th>
                      <th className="p-4">الطول</th>
                      <th className="p-4">العدد</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {neededPieces.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="p-4 font-bold">{p.label}</td>
                        <td className="p-4 font-black text-[#4a6575]">{p.length} م</td>
                        <td className="p-4 font-black">{p.quantity}</td>
                        <td className="p-4">
                          <button
                            onClick={() =>
                              setNeededPieces((prev) => prev.filter((x) => x.id !== p.id))
                            }
                            className="text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={saveProject}
                    className="px-8 py-4 bg-green-600 text-white rounded-2xl font-black hover:bg-green-700 flex items-center gap-2 shadow-lg transition-all active:scale-95"
                  >
                    <Save size={20} />
                    {projectInfo.id
                      ? 'حفظ المقايسة وتحديث العقد'
                      : 'حفظ المقايسة كـ أمر إنتاج (بدون تسعير)'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* ======================= قص الزجاج ======================= */}
        {activeTab === 'glass' && (
          <WorkspaceSectionShell
            eyebrow="أمر الإنتاج"
            title="قص الزجاج والألواح المسطحة"
            description="هذه الشاشة أصبحت جزءًا من أمر الإنتاج نفسه، حتى لا يضيع المستخدم بين شاشة مستقلة للزجاج وبقية بيانات التنفيذ."
            tabs={visibleProductionHubTabs}
            activeTab={activeTab}
            onChange={openProductionHub}
            summary={
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">قطع زجاج بالقائمة</div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {glassPiecesList.length.toLocaleString()} قطعة
                  </div>
                </div>
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">ألواح ناتجة</div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {(glassCutResults?.length || 0).toLocaleString()} لوح
                  </div>
                </div>
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">اللوح الخام</div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {glassRawSheet.w || '-'} × {glassRawSheet.h || '-'} سم
                  </div>
                </div>
              </div>
            }
          >
            <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm print:hidden">
              <div className="flex items-center gap-3 mb-6">
                <Maximize className="text-[#4a6575]" size={28} />
                <h2 className="text-2xl font-black text-[#314e60]">قص الألواح والزجاج</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-gray-50 p-6 rounded-2xl border">
                  <h3 className="font-black text-[#4a6575] mb-4">1. اللوح الخام (الجامبو)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500">
                        مسمى اللوح (اختياري)
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 bg-white rounded-xl border outline-none font-bold"
                        value={glassRawSheet.label || ''}
                        onChange={(e) =>
                          setGlassRawSheet((prev) => ({ ...prev, label: e.target.value }))
                        }
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500">العرض W (سم)</label>
                        <input
                          type="text"
                          className="w-full p-3 bg-white rounded-xl border outline-none font-black text-center"
                          value={glassRawSheet.w || ''}
                          onChange={(e) =>
                            setGlassRawSheet((prev) => ({ ...prev, w: e.target.value }))
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500">الطول H (سم)</label>
                        <input
                          type="text"
                          className="w-full p-3 bg-white rounded-xl border outline-none font-black text-center"
                          value={glassRawSheet.h || ''}
                          onChange={(e) =>
                            setGlassRawSheet((prev) => ({ ...prev, h: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">سماكة نصل القص (سم)</label>
                      <input
                        type="text"
                        className="w-full p-3 bg-white rounded-xl border outline-none font-black text-center text-red-500"
                        value={glassRawSheet.blade || ''}
                        onChange={(e) =>
                          setGlassRawSheet((prev) => ({ ...prev, blade: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#edf3f6]/50 p-6 rounded-2xl border border-indigo-100">
                  <h3 className="font-black text-[#4a6575] mb-4">2. القطع المطلوبة (النوافذ)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500">وصف القطعة</label>
                      <input
                        type="text"
                        className="w-full p-3 bg-white rounded-xl border outline-none font-bold"
                        value={currentGlassPiece.label || ''}
                        onChange={(e) =>
                          setCurrentGlassPiece((prev) => ({ ...prev, label: e.target.value }))
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500">عرض (سم)</label>
                        <input
                          type="text"
                          className="w-full p-3 bg-white rounded-xl border outline-none font-black text-center"
                          value={currentGlassPiece.w || ''}
                          onChange={(e) =>
                            setCurrentGlassPiece((prev) => ({ ...prev, w: e.target.value }))
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500">طول (سم)</label>
                        <input
                          type="text"
                          className="w-full p-3 bg-white rounded-xl border outline-none font-black text-center"
                          value={currentGlassPiece.h || ''}
                          onChange={(e) =>
                            setCurrentGlassPiece((prev) => ({ ...prev, h: e.target.value }))
                          }
                        />
                      </div>
                      <div className="w-20">
                        <label className="text-xs font-bold text-gray-500">العدد</label>
                        <input
                          type="text"
                          className="w-full p-3 bg-white rounded-xl border outline-none font-black text-center"
                          value={currentGlassPiece.qty || ''}
                          onChange={(e) =>
                            setCurrentGlassPiece((prev) => ({ ...prev, qty: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <button
                      onClick={addGlassPieceToList}
                      className="w-full py-3 bg-[#4a6575] text-white rounded-xl font-bold flex justify-center gap-2 hover:bg-[#4a4387] transition-all"
                    >
                      <Plus size={20} /> إضافة للقائمة
                    </button>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex-1 bg-white border rounded-2xl p-4 overflow-y-auto max-h-[250px] mb-4">
                    {glassPiecesList.length === 0 ? (
                      <p className="text-center text-gray-400 font-bold mt-10">لا توجد قطع مضافة</p>
                    ) : (
                      <div className="space-y-2">
                        {glassPiecesList.map((p) => (
                          <div
                            key={p.id}
                            className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border"
                          >
                            <div>
                              <p className="font-bold text-sm">{p.label}</p>
                              <p className="text-xs font-black text-[#4a6575]" dir="ltr">
                                {p.w} × {p.h}{' '}
                                <span className="text-red-500 ml-2">Qty: {p.qty}</span>
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                setGlassPiecesList((prev) => prev.filter((x) => x.id !== p.id))
                              }
                              className="text-red-400 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={run2DOptimization}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-green-700 transition-all flex justify-center gap-2"
                  >
                    <Scissors size={24} /> توليد خريطة القص
                  </button>
                </div>
              </div>
            </div>

            {glassCutResults && (
              <div className="bg-white rounded-[2rem] p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8 pb-4 border-b">
                  <h2 className="text-2xl font-black text-[#314e60]">خريطة التقطيع للفني</h2>
                  <div className="flex gap-4">
                    <div className="text-center px-6 py-2 bg-[#edf3f6] rounded-xl">
                      <p className="text-xs font-bold text-gray-500">الألواح المستخدمة</p>
                      <p className="text-xl font-black text-[#4a6575]">
                        {glassCutResults.length} ألواح
                      </p>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="px-6 py-2 bg-[#4a6575] text-white rounded-xl font-bold flex gap-2 items-center print:hidden"
                    >
                      <Printer size={18} /> طباعة
                    </button>
                  </div>
                </div>

                <div className="space-y-12">
                  {glassCutResults.map((sheet, idx) => (
                    <div key={idx} className="page-break-after">
                      <div className="flex justify-between mb-4">
                        <h3 className="font-black text-lg bg-[#314e60] text-white px-4 py-2 rounded-lg print:text-black print:bg-gray-100">
                          لوح رقم {sheet.sheetNum}{' '}
                          <span className="text-sm font-normal ml-2">
                            ({sheet.w} × {sheet.h} سم)
                          </span>
                        </h3>
                        <span className="font-bold text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
                          المساحة المهدرة:{' '}
                          {((sheet.wasteArea / (sheet.w * sheet.h)) * 100).toFixed(1)}%
                        </span>
                      </div>

                      <div
                        className="relative border-4 border-[#314e60] bg-blue-50/30 mx-auto print:border-black"
                        style={{
                          width: '100%',
                          maxWidth: '800px',
                          aspectRatio: `${sheet.w} / ${sheet.h}`
                        }}
                      >
                        {sheet.cuts.map((cut, cIdx) => {
                          const left = (cut.x / sheet.w) * 100
                          const top = (cut.y / sheet.h) * 100
                          const width = (cut.cutW / sheet.w) * 100
                          const height = (cut.cutH / sheet.h) * 100

                          return (
                            <div
                              key={cIdx}
                              className="absolute border border-[#4a6575] bg-white flex flex-col items-center justify-center overflow-hidden print:border-black print:bg-white"
                              style={{
                                left: `${left}%`,
                                top: `${top}%`,
                                width: `${width}%`,
                                height: `${height}%`
                              }}
                            >
                              <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-sm print:bg-gray-800 print:text-white border border-white">
                                {cut.step}
                              </div>

                              <span className="font-black text-[#4a6575] text-sm print:text-black mt-2">
                                {cut.w} × {cut.h}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis px-1 w-full text-center">
                                {cut.label}
                              </span>
                              {cut.rotated && (
                                <span className="text-[8px] bg-yellow-100 text-yellow-800 px-1 rounded mt-1">
                                  مُدار 90°
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          </WorkspaceSectionShell>
        )}

        {/* ======================= المستودع المركزي ======================= */}
        {activeTab === 'inventory' && (
          <WorkspaceSectionShell
            eyebrow="المواد والمشتريات"
            title="المخزون الفعلي وحركة الخامات"
            description="تابع الأرصدة الحالية، الفضلات، والزجاج والإكسسوارات من نفس مركز المواد. ويمكنك الانتقال فورًا إلى مركز المشتريات عند وجود عجز."
            tabs={visibleMaterialsHubTabs}
            activeTab={activeTab}
            onChange={openMaterialsHub}
            summary={
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">أصناف المستودع</div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {masterInventory.length.toLocaleString()} صنف
                  </div>
                </div>
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">مخزن الفضلات</div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {leftovers.length.toLocaleString()} فضلة
                  </div>
                </div>
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">عقود بنواقص مفتوحة</div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {activeContractsWithShortages.length.toLocaleString()} عقد
                  </div>
                </div>
              </div>
            }
          >
            <div className="animate-in fade-in duration-500 space-y-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm print:hidden">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-[#314e60] flex items-center gap-3">
                  <Boxes className="text-[#4a6575]" /> إدارة المستودع المركزي (خام)
                </h2>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl text-white mb-8 flex justify-between items-center shadow-lg">
                <div>
                  <p className="text-blue-200 font-bold mb-1">
                    إجمالي القيمة التقديرية للمواد (ألمنيوم + إكسسوار + زجاج)
                  </p>
                  <p className="text-4xl font-black">
                    {masterInventory
                      .reduce((sum, i) => sum + Math.max(0, i.stockQty) * i.price, 0)
                      .toLocaleString()}{' '}
                    <span className="text-lg">ر.س</span>
                  </p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                  <ShieldCheck size={32} />
                </div>
              </div>

              <div className="flex gap-4 border-b-2 mb-6">
                <button
                  onClick={() => setInventoryActiveTab('aluminum')}
                  className={`pb-3 font-black text-lg ${inventoryActiveTab === 'aluminum' ? 'border-b-4 border-[#4a6575] text-[#4a6575]' : 'text-gray-400'}`}
                >
                  أعواد الألمنيوم
                </button>
                <button
                  onClick={() => setInventoryActiveTab('accessories')}
                  className={`pb-3 font-black text-lg ${inventoryActiveTab === 'accessories' ? 'border-b-4 border-[#4a6575] text-[#4a6575]' : 'text-gray-400'}`}
                >
                  الإكسسوارات
                </button>
                <button
                  onClick={() => setInventoryActiveTab('glass')}
                  className={`pb-3 font-black text-lg ${inventoryActiveTab === 'glass' ? 'border-b-4 border-[#4a6575] text-[#4a6575]' : 'text-gray-400'}`}
                >
                  الزجاج (متر)
                </button>
                <button
                  onClick={() => setInventoryActiveTab('leftovers')}
                  className={`pb-3 font-black text-lg ${inventoryActiveTab === 'leftovers' ? 'border-b-4 border-orange-400 text-[#a98556]' : 'text-gray-400'}`}
                >
                  مخزن الفضلات
                </button>
              </div>

              {inventoryActiveTab !== 'leftovers' && (
                <div className="mb-6 flex gap-3 p-4 bg-gray-50 rounded-2xl border">
                  <input
                    type="text"
                    placeholder="اسم الصنف الجديد..."
                    className="flex-1 px-4 py-2 border rounded-xl outline-none font-bold"
                    value={newInventoryItem.name}
                    onChange={(e) =>
                      setNewInventoryItem({ ...newInventoryItem, name: e.target.value })
                    }
                  />
                  {inventoryActiveTab === 'aluminum' && (
                    <input
                      type="text"
                      placeholder="طول العود (م)"
                      className="w-32 px-4 py-2 border border-blue-200 bg-blue-50 text-blue-800 rounded-xl outline-none font-black text-center"
                      value={newInventoryItem.length}
                      onChange={(e) =>
                        setNewInventoryItem({ ...newInventoryItem, length: e.target.value })
                      }
                    />
                  )}
                  <input
                    type="text"
                    placeholder="السعر"
                    className="w-24 px-4 py-2 border rounded-xl outline-none font-bold text-center"
                    value={newInventoryItem.price}
                    onChange={(e) =>
                      setNewInventoryItem({ ...newInventoryItem, price: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="الكمية"
                    className="w-24 px-4 py-2 border rounded-xl outline-none font-bold text-center"
                    value={newInventoryItem.stockQty}
                    onChange={(e) =>
                      setNewInventoryItem({ ...newInventoryItem, stockQty: e.target.value })
                    }
                  />
                  <button
                    onClick={handleAddNewInventoryItem}
                    className="bg-[#4a6575] text-white px-6 py-2 rounded-xl font-bold flex gap-2 items-center"
                  >
                    <Plus size={18} /> إضافة
                  </button>
                </div>
              )}

              {inventoryActiveTab !== 'leftovers' && (
                <div className="border rounded-2xl overflow-hidden">
                  <table className="w-full text-right">
                    <thead className="bg-gray-100 text-gray-500 font-bold text-sm">
                      <tr>
                        <th className="p-4">اسم الصنف (كما يظهر في فاتورة المورد)</th>
                        {inventoryActiveTab === 'aluminum' && (
                          <th className="p-4 text-center">طول العود (م)</th>
                        )}
                        <th className="p-4 text-center">سعر الوحدة (للتكلفة)</th>
                        <th className="p-4 text-center">الرصيد الفعلي</th>
                        <th className="p-4 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masterInventory
                        .filter(
                          (i) =>
                            i.category ===
                            (inventoryActiveTab === 'aluminum'
                              ? 'aluminum'
                              : inventoryActiveTab === 'accessories'
                                ? 'accessory'
                                : 'glass')
                        )
                        .map((item) => (
                          <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-black text-[#314e60]">
                              <input
                                className="bg-transparent outline-none w-full"
                                value={item.name}
                                onChange={(e) =>
                                  handleUpdateMasterStock(item.id, 'name', e.target.value)
                                }
                              />
                            </td>
                            {inventoryActiveTab === 'aluminum' && (
                              <td className="p-4 text-center">
                                <input
                                  type="text"
                                  className="w-20 bg-blue-50 text-blue-700 text-center font-black rounded-lg p-1 outline-none border border-blue-100 focus:border-[#4a6575]"
                                  value={item.length || '5.8'}
                                  onChange={(e) =>
                                    handleUpdateMasterStock(item.id, 'length', e.target.value)
                                  }
                                />
                              </td>
                            )}
                            <td className="p-4 text-center">
                              <input
                                type="text"
                                className="w-20 bg-transparent text-center font-bold text-gray-500 outline-none border-b focus:border-[#4a6575]"
                                value={item.price}
                                onChange={(e) =>
                                  handleUpdateMasterStock(item.id, 'price', e.target.value)
                                }
                              />
                            </td>
                            <td className="p-4 text-center">
                              <input
                                type="text"
                                className={`w-24 px-3 py-2 rounded-lg font-black text-center outline-none border ${item.stockQty < 0 ? 'bg-red-50 text-red-600 border-red-200 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-green-50 text-green-700 border-green-100'}`}
                                value={item.stockQty}
                                onChange={(e) =>
                                  handleUpdateMasterStock(item.id, 'stockQty', e.target.value)
                                }
                              />
                              {item.stockQty < 0 && (
                                <div className="text-[10px] font-black text-red-500 mt-1">
                                  مطلوب شراء!
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => {
                                  requestConfirm(
                                    'هل أنت متأكد من حذف هذا الصنف من المستودع نهائياً؟',
                                    () => {
                                      setMasterInventory((prev) =>
                                        prev.filter((i) => i.id !== item.id)
                                      )
                                    }
                                  )
                                }}
                                className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {inventoryActiveTab === 'leftovers' && (
                <div>
                  {leftovers.length === 0 ? (
                    <div className="bg-gray-50 rounded-[2rem] p-16 text-center text-gray-400 border">
                      <Archive size={64} className="mx-auto mb-4 opacity-50" />
                      <p className="font-bold text-lg">مخزن الفضلات فارغ حالياً.</p>
                    </div>
                  ) : (
                    <table className="w-full text-right text-sm">
                      <thead className="bg-gray-50 text-gray-500 font-bold">
                        <tr>
                          <th className="p-4 rounded-r-xl">القطاع</th>
                          <th className="p-4">النوع</th>
                          <th className="p-4 text-center">الطول المتوفر</th>
                          <th className="p-4 text-center rounded-l-xl">إجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leftovers.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="p-4 font-black">{item.profileName}</td>
                            <td className="p-4">
                              <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-black">
                                {item.extrusionType}
                              </span>
                            </td>
                            <td className="p-4 font-black text-[#4a6575] text-lg text-center">
                              {item.length} م
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => deleteLeftover(item.id)}
                                className="px-4 py-2 bg-red-50 text-red-500 rounded-xl font-bold text-xs hover:bg-red-100"
                              >
                                <Trash2 size={16} className="mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
          </WorkspaceSectionShell>
        )}
        {activeTab === 'procurement' && (
          <WorkspaceSectionShell
            eyebrow="المواد والمشتريات"
            title="مركز نواقص الشراء"
            description="هنا تظهر فقط المواد غير المغطاة بالمخزون داخل العقود الجارية، حتى تخرج الطلبية من الواقع الفعلي للمصنع لا من مجرد التقدير النظري."
            tabs={visibleMaterialsHubTabs}
            activeTab={activeTab}
            onChange={openMaterialsHub}
            summary={
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">عقود تحتاج شراء</div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {activeContractsWithShortages.length.toLocaleString()} عقد
                  </div>
                </div>
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">نواقص الملف المفتوح</div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {liveShortagesSummary.linesCount.toLocaleString()} بند
                  </div>
                </div>
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">حالة التنفيذ</div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {liveShortagesSummary.statusLabel}
                  </div>
                </div>
              </div>
            }
          >
            <ProcurementWorkspace
              records={activeContractsWithShortages}
              liveShortages={liveShortagesSummary}
              onOpenLiveOrder={() => openProductionHub('cutting')}
              onOpenRecord={(contractId) => {
                const targetProject = savedProjects.find((project) => project.id === contractId)
                if (!targetProject) return
                loadProject(targetProject)
                openProductionHub('reports')
                setReportType('bom_supplier')
              }}
            />
          </WorkspaceSectionShell>
        )}
        {/* ======================= 7. تقارير المصنع ======================= */}
        {activeTab === 'reports' && (
          <WorkspaceSectionShell
            eyebrow="أمر الإنتاج"
            title="تقارير الورشة والتكلفة والطباعة"
            description="كل ما يخرج من أمر الإنتاج يظهر هنا: التكلفة الداخلية، نواقص الشراء، خريطة القص، والملصقات. لم تعد التقارير شاشة منفصلة عن التنفيذ بل جزءًا منه."
            tabs={visibleProductionHubTabs}
            activeTab={activeTab}
            onChange={openProductionHub}
            summary={
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">نوع التقرير</div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {reportType === 'bom_internal'
                      ? 'تكلفة داخلية'
                      : reportType === 'bom_supplier'
                        ? 'طلبية النواقص'
                        : reportType === 'technician'
                          ? 'خريطة التقطيع'
                          : 'طباعة الباركود'}
                  </div>
                </div>
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">تكلفة داخلية</div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {productionOrderSnapshot.costs.totalInternalCost.toLocaleString(undefined, {
                      maximumFractionDigits: 2
                    })}{' '}
                    ر.س
                  </div>
                </div>
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">نواقص الشراء</div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {liveShortagesSummary.linesCount.toLocaleString()} بند
                  </div>
                </div>
              </div>
            }
          >
            <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
              <button
                onClick={() => setReportType('bom_internal')}
                className={`p-5 rounded-[2rem] shadow-sm flex flex-col items-center gap-3 transition-all ${reportType === 'bom_internal' ? 'bg-[#4a6575] text-white' : 'bg-white text-[#4a6575]'}`}
              >
                <ListChecks size={24} />
                <span className="font-black text-sm">تكلفة داخلية (الأسعار)</span>
              </button>
              <button
                onClick={() => setReportType('bom_supplier')}
                className={`p-5 rounded-[2rem] shadow-sm flex flex-col items-center gap-3 transition-all ${reportType === 'bom_supplier' ? 'bg-[#4a6575] text-white' : 'bg-white text-[#4a6575]'}`}
              >
                <ShoppingCart size={24} />
                <span className="font-black text-sm">طلبية النواقص (للمورد)</span>
              </button>
              <button
                onClick={() => setReportType('technician')}
                className={`p-5 rounded-[2rem] shadow-sm flex flex-col items-center gap-3 transition-all ${reportType === 'technician' ? 'bg-[#4a6575] text-white' : 'bg-white text-[#4a6575]'}`}
              >
                <Scissors size={24} />
                <span className="font-black text-sm">خريطة التقطيع (الفني)</span>
              </button>
              <button
                onClick={() => {
                  setReportType('labels')
                  setTimeout(window.print, 100)
                }}
                className={`p-5 rounded-[2rem] shadow-sm flex flex-col items-center gap-3 transition-all ${reportType === 'labels' ? 'bg-[#4a6575] text-white' : 'bg-white text-[#4a6575]'}`}
              >
                <Printer size={24} />
                <span className="font-black text-sm">طباعة الباركود</span>
              </button>
            </div>

            <div className="print:hidden">
              {currentReportContractSnapshot ? (
                <ReportContractStatusPanel snapshot={currentReportContractSnapshot} />
              ) : (
                <div className="rounded-[2rem] border border-dashed border-blue-200 bg-blue-50 px-6 py-5">
                  <div className="flex items-center gap-3 text-[#314e60]">
                    <AlertCircle size={18} />
                    <span className="font-black">
                      هذه التقارير تخص مقايسة حرة أو أمرًا داخليًا غير مرتبط بعقد.
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-gray-500">
                    عند ربط الملف بعقد ستظهر هنا حالة التنفيذ، نسبة التحصيل، وخط سير العقد الكامل.
                  </p>
                </div>
              )}
            </div>

            {/* ----------------- 1. التقرير المالي الداخلي (بالأسعار) ----------------- */}
            {reportType === 'bom_internal' && (
              <div className="bg-white p-12 rounded-[2rem] shadow-sm min-h-[500px] print:shadow-none print:p-0">
                <div className="flex justify-between items-center mb-8 pb-4 border-b print:hidden">
                  <h2 className="text-2xl font-black text-[#314e60]">
                    التكلفة المالية الداخلية (BOM)
                  </h2>
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-2.5 bg-[#4a6575] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#4a4387]"
                  >
                    <Printer size={18} /> طباعة التقرير
                  </button>
                </div>

                <div className="hidden print:flex justify-between border-b-4 border-[#314e60] pb-4 mb-6">
                  <div>
                    <h1 className="text-3xl font-black">تقرير تكلفة المصنع الداخلية</h1>
                    <p className="font-bold text-gray-600 mt-2 text-sm">
                      التاريخ: {projectInfo.date} |{' '}
                      <span className="bg-gray-200 px-2 py-1 rounded text-black">
                        رقم الملف: {projectInfo.id || 'بدون'}
                      </span>
                    </p>
                  </div>
                  <div className="font-black text-lg text-left bg-gray-50 p-3 rounded-xl border border-gray-200">
                    العميل: {projectInfo.clientName || 'غير مسجل'}
                  </div>
                </div>

                {currentReportContractSnapshot && (
                  <ReportContractStatusPanel
                    snapshot={currentReportContractSnapshot}
                    compact
                    className="hidden print:block mb-6"
                  />
                )}

                {currentProjectResults.length > 0 && (
                  <div className="mb-10">
                    <h3 className="text-xl font-bold bg-[#F4F7FE] p-3 rounded-t-xl print:bg-gray-100">
                      1. الألمنيوم
                    </h3>
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-gray-50 font-bold">
                          <th className="p-3 border">المسمى (كما في المستودع)</th>
                          <th className="p-3 border text-center">الكمية</th>
                          <th className="p-3 border text-center">السعر</th>
                          <th className="p-3 border text-center">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentProjectResults.map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-3 border font-bold text-[#314e60]">{item.itemName}</td>
                            <td className="p-3 border font-black text-red-600 text-center">
                              {item.bars.length}
                            </td>
                            <td className="p-3 border font-bold text-gray-500 text-center">
                              {item.pricePerBar}
                            </td>
                            <td className="p-3 border font-black text-[#4a6575] text-center">
                              {(item.bars.length * item.pricePerBar).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {neededGlass.length > 0 && (
                  <div className="mb-10">
                    <h3 className="text-xl font-bold bg-blue-50 p-3 rounded-t-xl print:bg-gray-100">
                      2. الزجاج
                    </h3>
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-gray-50 font-bold">
                          <th className="p-3 border">النوع (بالمستودع)</th>
                          <th className="p-3 border text-center">الكمية</th>
                          <th className="p-3 border text-center">السعر</th>
                          <th className="p-3 border text-center">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {neededGlass.map((item, idx) => {
                          const invItem = masterInventory.find((i) => i.id === item.inventoryId)
                          const rawName = invItem
                            ? invItem.name
                            : item.label.split(' - ')[1] || item.label
                          const price = invItem ? invItem.price : 0
                          return (
                            <tr key={idx} className="border-b">
                              <td className="p-3 border font-bold text-[#314e60]">
                                {rawName}{' '}
                                <span className="text-xs text-gray-400" dir="ltr">
                                  ({item.w} × {item.h})
                                </span>
                              </td>
                              <td className="p-3 border font-black text-red-600 text-center">
                                {item.quantity}
                              </td>
                              <td className="p-3 border font-bold text-gray-500 text-center">
                                {price}
                              </td>
                              <td className="p-3 border font-black text-[#4a6575] text-center">
                                {(item.w * item.h * item.quantity * price).toLocaleString()}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {aggregatedAccessories.length > 0 && (
                  <div className="mb-10">
                    <h3 className="text-xl font-bold bg-[#fbf4ea] p-3 rounded-t-xl print:bg-gray-100">
                      3. الإكسسوارات
                    </h3>
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-gray-50 font-bold">
                          <th className="p-3 border">الصنف (بالمستودع)</th>
                          <th className="p-3 border text-center">الكمية الإجمالية</th>
                          <th className="p-3 border text-center">السعر</th>
                          <th className="p-3 border text-center">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aggregatedAccessories.map((item, idx) => {
                          const invItem = masterInventory.find((i) => i.id === item.inventoryId)
                          const rawName = invItem
                            ? invItem.name
                            : item.name.split(' (')[0] || item.name
                          const price = invItem ? invItem.price : 0
                          return (
                            <tr key={idx} className="border-b">
                              <td className="p-3 border font-bold text-[#314e60]">{rawName}</td>
                              <td className="p-3 border font-black text-orange-600 text-center">
                                {item.quantity}
                              </td>
                              <td className="p-3 border font-bold text-gray-500 text-center">
                                {price}
                              </td>
                              <td className="p-3 border font-black text-[#4a6575] text-center">
                                {(item.quantity * price).toLocaleString()}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {aggregatedOperations.length > 0 && (
                  <div className="mb-10">
                    <h3 className="text-xl font-bold bg-emerald-50 p-3 rounded-t-xl print:bg-gray-100">
                      4. عمليات الورشة والتشغيل
                    </h3>
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-gray-50 font-bold">
                          <th className="p-3 border">العملية</th>
                          <th className="p-3 border text-center">الفئة</th>
                          <th className="p-3 border text-center">الكمية</th>
                          <th className="p-3 border text-center">تكلفة الوحدة</th>
                          <th className="p-3 border text-center">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aggregatedOperations.map((item, idx) => {
                          const categoryLabel =
                            technicalOperationCategories.find(
                              (category) => category.value === item.category
                            )?.label || item.category
                          return (
                            <tr key={idx} className="border-b">
                              <td className="p-3 border font-bold text-[#314e60]">
                                <div>{item.name}</div>
                                {item.notes && (
                                  <div className="mt-1 text-xs font-bold text-gray-400">
                                    {item.notes}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 border font-bold text-center text-emerald-700">
                                {categoryLabel}
                              </td>
                              <td className="p-3 border font-black text-emerald-700 text-center">
                                {item.quantity} {item.unitLabel}
                              </td>
                              <td className="p-3 border font-bold text-gray-500 text-center">
                                {item.costPerUnit}
                              </td>
                              <td className="p-3 border font-black text-[#4a6575] text-center">
                                {item.totalCost.toLocaleString()}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-8 bg-[#314e60] text-white p-6 rounded-2xl flex justify-between font-black text-2xl print:bg-transparent print:text-black print:border print:border-black">
                  <span>إجمالي تكلفة الإنتاج الداخلية:</span>
                  <span>{totalCost.toLocaleString()} ر.س</span>
                </div>
              </div>
            )}

            {/* ----------------- 2. أمر شراء رسمي للمورد (PO) بدون أسعار ----------------- */}
            {reportType === 'bom_supplier' && (
              <div className="bg-white p-12 rounded-[2rem] shadow-sm min-h-[500px] print:shadow-none print:p-0">
                <div className="flex justify-between items-center mb-8 pb-4 border-b print:hidden">
                  <h2 className="text-2xl font-black text-[#314e60]">أمر شراء مواد للمورد (PO)</h2>
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 shadow-md"
                  >
                    <Printer size={18} /> طباعة أمر الشراء
                  </button>
                </div>

                <div className="flex justify-between items-start border-b-4 border-[#4a6575] pb-6 mb-8 print:border-black">
                  <div className="flex gap-6 items-center">
                    {companySettings.logo && (
                      <img
                        src={companySettings.logo}
                        alt="شعار"
                        className="max-h-24 object-contain"
                      />
                    )}
                    <div>
                      <h1 className="text-3xl font-black text-[#4a6575] mb-2 print:text-black">
                        {companySettings.name}
                      </h1>
                      <p className="text-sm font-bold text-gray-500 flex gap-4">
                        {companySettings.crNumber && (
                          <span>
                            س.ت: <span dir="ltr">{companySettings.crNumber}</span>
                          </span>
                        )}
                        {companySettings.taxNumber && (
                          <span>
                            الرقم الضريبي: <span dir="ltr">{companySettings.taxNumber}</span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-center bg-[#F4F7FE] print:bg-gray-100 print:border print:border-black p-4 rounded-2xl">
                    <h2 className="text-2xl font-black text-[#4a6575] print:text-black tracking-wider">
                      أمر شراء (PO)
                    </h2>
                    <p className="font-bold border-t border-gray-300 pt-2 mt-2">
                      التاريخ:{' '}
                      <input
                        type="text"
                        defaultValue={projectInfo.date}
                        className="w-24 bg-transparent outline-none text-center font-bold"
                      />
                    </p>
                  </div>
                </div>

                {currentReportContractSnapshot && (
                  <ReportContractStatusPanel
                    snapshot={currentReportContractSnapshot}
                    compact
                    className="hidden print:block mb-6"
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl print:bg-transparent print:p-0 print:border-b-2 print:rounded-none">
                    <span className="font-black text-[#314e60] whitespace-nowrap print:text-black">
                      السادة الموردين /
                    </span>
                    <input
                      type="text"
                      className="flex-1 bg-transparent outline-none font-black text-lg text-blue-800 print:text-black"
                      placeholder="اكتب اسم شركة المورد هنا..."
                    />
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl print:bg-transparent print:p-0 print:border-b-2 print:rounded-none">
                    <span className="font-black text-[#314e60] whitespace-nowrap print:text-black">
                      رقم الطلبية /
                    </span>
                    <input
                      type="text"
                      className="flex-1 bg-transparent outline-none font-black text-lg text-red-600 print:text-black"
                      placeholder="أدخل رقم أو مرجع..."
                    />
                  </div>
                </div>

                <p className="font-bold text-gray-600 mb-6 print:text-black">
                  نأمل منكم التكرم بتجهيز المواد الموضحة أدناه، وإرسالها أو تجهيزها للاستلام:
                </p>

                {!isCurrentContractLinked && (
                  <div className="mb-8 rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-6 text-center">
                    <p className="font-black text-[#314e60]">
                      هذه مقايسة حرة بدون عقد، لذلك لا يتم إنشاء طلبية شراء أو خصم من المخزون.
                    </p>
                    <p className="mt-2 text-sm font-bold text-gray-500">
                      اربط المقاسات بعقد محفوظ أولًا حتى تظهر هنا نواقص المواد المطلوب طلبها فقط.
                    </p>
                  </div>
                )}

                {isCurrentContractLinked && !hasPurchaseShortages && (
                  <div className="mb-8 rounded-2xl border border-dashed border-green-200 bg-green-50 p-6 text-center">
                    <p className="font-black text-green-700">
                      المخزون الحالي يغطي كامل احتياج هذا العقد.
                    </p>
                    <p className="mt-2 text-sm font-bold text-gray-500">
                      لا توجد نواقص مطلوبة للمورد في الوقت الحالي.
                    </p>
                  </div>
                )}

                {isCurrentContractLinked &&
                  productionOrderSnapshot.procurement.categories.aluminum.linesCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-black bg-[#4a6575] text-white p-3 rounded-t-xl print:bg-gray-200 print:text-black print:border print:border-black">
                      1. قطاعات الألمنيوم الناقصة
                    </h3>
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-gray-100 font-bold print:border print:border-black">
                          <th className="p-3 border print:border-black w-12 text-center">م</th>
                          <th className="p-3 border print:border-black">اسم الصنف الخام</th>
                          <th className="p-3 border print:border-black w-32 text-center">
                            الكمية (عود)
                          </th>
                          <th className="p-3 border print:border-black w-1/3">ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productionOrderSnapshot.procurement.categories.aluminum.rows.map(
                          (item, idx) => (
                          <tr key={idx} className="border-b print:border-black">
                            <td className="p-3 border print:border-black text-center font-bold">
                              {idx + 1}
                            </td>
                            <td className="p-3 border print:border-black font-black text-[#314e60]">
                              {item.itemName}
                            </td>
                            <td className="p-3 border print:border-black font-black text-xl text-center">
                              {item.shortageQty}
                            </td>
                            <td className="p-3 border print:border-black">
                              <input
                                type="text"
                                className="w-full bg-transparent outline-none"
                                placeholder="..................................."
                              />
                            </td>
                          </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {isCurrentContractLinked &&
                  productionOrderSnapshot.procurement.categories.glass.linesCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-black bg-[#4a6575] text-white p-3 rounded-t-xl print:bg-gray-200 print:text-black print:border print:border-black">
                      2. الزجاج والألواح الناقصة
                    </h3>
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-gray-100 font-bold print:border print:border-black">
                          <th className="p-3 border print:border-black w-12 text-center">م</th>
                          <th className="p-3 border print:border-black">نوع الزجاج والمقاس</th>
                          <th className="p-3 border print:border-black w-32 text-center">العدد</th>
                          <th className="p-3 border print:border-black w-1/3">ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productionOrderSnapshot.procurement.categories.glass.rows.map((item, idx) => {
                          return (
                            <tr key={idx} className="border-b print:border-black">
                              <td className="p-3 border print:border-black text-center font-bold">
                                {idx + 1}
                              </td>
                              <td className="p-3 border print:border-black font-black text-[#314e60]">
                                {item.itemName}{' '}
                                <span dir="ltr" className="mr-4 text-blue-600">
                                  ({item.width} × {item.height})
                                </span>
                              </td>
                              <td className="p-3 border print:border-black font-black text-xl text-center">
                                {item.shortageQty}
                              </td>
                              <td className="p-3 border print:border-black">
                                <input
                                  type="text"
                                  className="w-full bg-transparent outline-none"
                                  placeholder="..................................."
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {isCurrentContractLinked &&
                  productionOrderSnapshot.procurement.categories.accessories.linesCount > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-black bg-[#4a6575] text-white p-3 rounded-t-xl print:bg-gray-200 print:text-black print:border print:border-black">
                        3. الإكسسوارات الناقصة
                      </h3>
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-gray-100 font-bold print:border print:border-black">
                            <th className="p-3 border print:border-black w-12 text-center">م</th>
                            <th className="p-3 border print:border-black">اسم الصنف</th>
                            <th className="p-3 border print:border-black w-32 text-center">
                              الكمية الإجمالية
                            </th>
                            <th className="p-3 border print:border-black w-1/3">ملاحظات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productionOrderSnapshot.procurement.categories.accessories.rows.map(
                            (item, idx) => {
                            return (
                              <tr key={idx} className="border-b print:border-black">
                                <td className="p-3 border print:border-black text-center font-bold">
                                  {idx + 1}
                                </td>
                                <td className="p-3 border print:border-black font-black text-[#314e60]">
                                  {item.itemName}
                                </td>
                                <td className="p-3 border print:border-black font-black text-xl text-center">
                                  {item.shortageQty}
                                </td>
                                <td className="p-3 border print:border-black">
                                  <input
                                    type="text"
                                    className="w-full bg-transparent outline-none"
                                    placeholder="..................................."
                                  />
                                </td>
                              </tr>
                            )
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                <div className="mt-16 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="font-bold text-gray-500 mb-8 print:text-black">مدير الإنتاج</p>
                    <p className="border-t border-dashed border-gray-400 mx-8 pt-2">التوقيع</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-500 mb-8 print:text-black">المحاسب</p>
                    <p className="border-t border-dashed border-gray-400 mx-8 pt-2">التوقيع</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-500 mb-8 print:text-black">
                      المستلم (المندوب)
                    </p>
                    <p className="border-t border-dashed border-gray-400 mx-8 pt-2">
                      التوقيع / الختم
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------- 3. خريطة التقطيع الاحترافية للفني ----------------- */}
            {reportType === 'technician' && currentProjectResults.length > 0 && (
              <div className="bg-white p-8 rounded-[2rem] shadow-sm min-h-[500px] print:shadow-none print:p-0 print:bg-transparent">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-8 print:hidden border-b pb-6">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedTechProfile('all')}
                      className={`px-5 py-2.5 rounded-xl font-black transition-all ${selectedTechProfile === 'all' ? 'bg-[#4a6575] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      عرض الكل
                    </button>
                    {currentProjectResults.map((res, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTechProfile(idx)}
                        className={`px-5 py-2.5 rounded-xl font-black transition-all ${selectedTechProfile === idx ? 'bg-[#4a6575] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        {res.itemName} ({res.bars.length})
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="bg-green-500 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-green-600 shadow-md"
                  >
                    <Printer size={20} /> طباعة المُحدد
                  </button>
                </div>

                <div className="hidden print:flex justify-between items-end border-b-4 border-[#314e60] pb-4 mb-8">
                  <div>
                    <h1 className="text-3xl font-black text-[#314e60]">خريطة التقطيع للفني</h1>
                    <p className="font-bold text-gray-500 mt-2 text-lg">
                      المشروع: {projectInfo.clientName || 'بدون اسم'}
                    </p>
                  </div>
                  <div className="text-left font-bold text-sm bg-gray-100 p-3 rounded-xl border border-gray-300">
                    <p>التاريخ: {projectInfo.date}</p>
                    <p className="text-red-600">رقم العقد: {projectInfo.id || 'غير مربوط'}</p>
                  </div>
                </div>

                {currentReportContractSnapshot && (
                  <ReportContractStatusPanel
                    snapshot={currentReportContractSnapshot}
                    compact
                    className="hidden print:block mb-6"
                  />
                )}

                {aggregatedOperations.length > 0 && (
                  <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-6 print:bg-white print:border-black">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <h3 className="text-xl font-black text-emerald-800 print:text-black">
                        تعليمات الورشة والتجميع
                      </h3>
                      <span className="text-sm font-black text-emerald-700 print:text-black">
                        {aggregatedOperations.length} بند تشغيل
                      </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {Object.entries(groupedWorkshopOperations).map(([category, operations]) => {
                        const categoryLabel =
                          technicalOperationCategories.find((item) => item.value === category)
                            ?.label || category
                        return (
                          <div
                            key={category}
                            className="rounded-2xl border border-emerald-100 bg-white p-4 print:border-black"
                          >
                            <h4 className="font-black text-[#314e60] mb-3">{categoryLabel}</h4>
                            <div className="space-y-3">
                              {operations.map((operation, index) => (
                                <div
                                  key={`${category}-${index}-${operation.name}`}
                                  className="rounded-xl border border-dashed border-gray-200 p-3 print:border-black"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="font-black text-[#314e60]">
                                      {operation.name}
                                    </span>
                                    <span className="font-black text-emerald-700 print:text-black">
                                      {operation.quantity} {operation.unitLabel}
                                    </span>
                                  </div>
                                  {operation.notes && (
                                    <p className="mt-2 text-xs font-bold text-gray-500 print:text-black">
                                      {operation.notes}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-12">
                  {currentProjectResults
                    .filter(
                      (_, idx) => selectedTechProfile === 'all' || selectedTechProfile === idx
                    )
                    .map((res, id) => {
                      const groupedBars = groupIdenticalBars(res.bars)
                      return (
                        <div key={id} className="page-break-after print:mt-0">
                          <div className="bg-[#314e60] text-white p-4 rounded-xl mb-6 flex justify-between items-center font-black print:bg-gray-100 print:text-black print:border-2 print:border-black">
                            <span className="text-xl">{res.itemName}</span>
                            <span className="bg-white/20 px-3 py-1 rounded-lg print:border print:border-black">
                              طول العود الخام: {res.barLength}م
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-6">
                            {groupedBars.map((bar, bIdx) => (
                              <div
                                key={bIdx}
                                className="border-2 border-gray-200 rounded-2xl p-6 bg-white shadow-sm print:border-black print:shadow-none"
                              >
                                <div className="flex justify-between items-center mb-6">
                                  <div className="flex items-center gap-4">
                                    <div className="bg-[#4a6575] text-white px-4 py-2 rounded-xl font-black text-sm print:bg-black">
                                      نموذج {bIdx + 1}
                                    </div>
                                    <div className="font-bold text-gray-500 text-lg">
                                      أعواد مطلوبة:{' '}
                                      <span className="text-2xl text-red-500 font-black px-2 print:text-black">
                                        {bar.patternCount}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="font-black text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-200 print:border-black print:bg-white print:text-black">
                                    باقي الفضلة:{' '}
                                    <span className="text-xl px-1">{bar.remaining.toFixed(3)}</span>
                                    م
                                  </div>
                                </div>

                                <div className="relative h-20 bg-gray-50 border-2 border-[#314e60] rounded-lg overflow-hidden flex shadow-inner print:border-black">
                                  {bar.cuts.map((cut, cIdx) => (
                                    <React.Fragment key={cIdx}>
                                      {cut.technicalWaste > 0 && (
                                        <div
                                          style={{
                                            width: `${(cut.technicalWaste / bar.totalLength) * 100}%`
                                          }}
                                          className="h-full bg-red-400 border-l border-red-600 flex items-center justify-center print:bg-gray-400 print:border-black"
                                        >
                                          <span className="text-[10px] text-white font-black transform -rotate-90 md:rotate-0 print:text-black">
                                            هالك
                                          </span>
                                        </div>
                                      )}
                                      <div
                                        style={{
                                          width: `${(cut.length / bar.totalLength) * 100}%`
                                        }}
                                        className={`h-full border-l border-[#314e60] flex flex-col items-center justify-center print:border-black ${cIdx % 2 === 0 ? 'bg-[#e6edf2] print:bg-gray-100' : 'bg-[#eceff2] print:bg-white'}`}
                                      >
                                        <span className="font-black text-xl text-[#314e60] print:text-black">
                                          {cut.length}
                                        </span>
                                        <span
                                          className="text-[11px] font-bold text-gray-500 truncate w-full text-center px-1 print:text-black"
                                          title={cut.label}
                                        >
                                          {cut.label}
                                        </span>
                                      </div>
                                    </React.Fragment>
                                  ))}
                                  {bar.remaining > 0 && (
                                    <div
                                      style={{
                                        width: `${(bar.remaining / bar.totalLength) * 100}%`
                                      }}
                                      className="h-full bg-green-100 flex items-center justify-center border-l-2 border-dashed border-green-500 print:bg-white print:border-black"
                                    >
                                      <span className="font-black text-green-700 print:text-black">
                                        {bar.remaining.toFixed(3)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* ----------------- 4. طباعة الباركود ----------------- */}
            {reportType === 'labels' && (
              <div className="bg-white p-12 rounded-[2rem] shadow-sm min-h-[500px] print:shadow-none print:p-0">
                <div className="flex flex-wrap gap-4">
                  {neededPieces.map((p, pIdx) => {
                    const profile = profiles.find((pr) => pr.id === p.profileId)
                    return Array.from({ length: p.quantity }).map((_, qIdx) => (
                      <div
                        key={`${pIdx}-${qIdx}`}
                        className="border-2 border-gray-800 p-2 w-[50mm] h-[30mm] flex flex-col justify-between print:m-0 page-break-after"
                      >
                        <div className="font-black text-[11px] border-b border-gray-400 pb-1 text-center">
                          {profile?.name}
                        </div>
                        <div className="text-center font-black text-2xl">{p.length} م</div>
                        <div className="font-bold text-[10px] border-t border-gray-400 pt-1 flex justify-between">
                          <span className="bg-black text-white px-1 rounded">{p.cutType}Â°</span>
                          <span className="truncate max-w-[30mm]">{p.label}</span>
                        </div>
                      </div>
                    ))
                  })}
                </div>
              </div>
            )}
          </div>
          </WorkspaceSectionShell>
        )}
        {/* ======================= الكتالوج الوصفي ======================= */}
        {activeTab === 'profiles' && (
          <WorkspaceSectionShell
            eyebrow="الإدارة الفنية"
            title="الأنظمة الفنية ومحرك التصنيع"
            description="الأنظمة الفنية هي القاعدة التي يبني عليها البرنامج القص والزجاج والإكسسوارات والعمليات. لذلك أصبحت ضمن مركز إدارة واضح مستقل عن العمل اليومي."
            tabs={visibleAdminHubTabs}
            activeTab={activeTab}
            onChange={openAdminHub}
            summary={
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">الأنظمة الفنية</div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {profiles.length.toLocaleString()} نظام
                  </div>
                </div>
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">أنظمة جاهزة</div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {
                      profiles.filter((profile) => !(profileHealthMap[profile.id]?.errors.length || 0))
                        .length
                    }{' '}
                    نظام
                  </div>
                </div>
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">أنظمة تحتاج مراجعة</div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {
                      profiles.filter((profile) => profileHealthMap[profile.id]?.errors.length || 0)
                        .length
                    }{' '}
                    نظام
                  </div>
                </div>
              </div>
            }
          >
            <div className="animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-[#314e60] flex gap-3">
                  <Package className="text-[#4a6575]" /> الكتالوج والتخصيم (BOM)
                </h2>
                <button
                  onClick={openAddProfile}
                  className="px-6 py-3 bg-[#4a6575] text-white rounded-2xl font-bold"
                >
                  <Plus size={20} /> إضافة نظام
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {profiles.map((p) => {
                  const status = profileHealthMap[p.id]

                  return (
                    <div
                      key={p.id}
                      className="bg-white p-8 rounded-[2rem] shadow-sm border-t-4 border-[#4a6575]"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <h3 className="font-black text-xl">{p.name}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-black border whitespace-nowrap ${status?.errors.length ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}
                        >
                          {status?.errors.length ? 'غير مكتمل' : 'جاهز'}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="font-bold text-gray-500">
                          ألمنيوم: {status?.summary.aluminumCount || 0} | زجاج:{' '}
                          {status?.summary.glassCount || 0} | إكسسوارات:{' '}
                          {status?.summary.accessoriesCount || 0} | عمليات:{' '}
                          {status?.summary.operationsCount || 0}
                        </p>
                        {status?.warnings.length > 0 && (
                          <p className="font-bold text-amber-600">
                            {status.warnings.length} ملاحظات تحتاج مراجعة
                          </p>
                        )}
                      </div>
                      <div className="flex justify-between mt-6 pt-6 border-t">
                        <button
                          onClick={() => openEditProfile(p)}
                          className="p-3 bg-[#F4F7FE] text-[#4a6575] rounded-xl"
                        >
                          <Settings size={18} />
                        </button>
                        <button
                          onClick={() => {
                            requestConfirm('حذف القطاع؟', () =>
                              setProfiles((prev) => prev.filter((x) => x.id !== p.id))
                            )
                          }}
                          className="p-3 bg-red-50 text-red-500 rounded-xl"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </WorkspaceSectionShell>
        )}

        {/* ======================= 9. الأرشيف ======================= */}
        {activeTab === 'history' && (
          <WorkspaceSectionShell
            eyebrow="العقود والتنفيذ"
            title="مركز متابعة العقود ودورة التنفيذ"
            description="هذه الشاشة أصبحت مرجع التشغيل الحقيقي للعقود: ما يزال تحت التنفيذ، ما اكتمل، وما بقي من ملفات حرة أو أوامر داخلية خارج دورة التعاقد."
            summary={
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">
                    عقود تحت التنفيذ
                  </div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {(contractProjects.length - completedContractProjects.length).toLocaleString()} عقد
                  </div>
                </div>
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">
                    عقود مكتملة
                  </div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {completedContractProjects.length.toLocaleString()} عقد
                  </div>
                </div>
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">
                    ملفات حرة / داخلية
                  </div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {nonContractRecordsCount.toLocaleString()} ملف
                  </div>
                </div>
              </div>
            }
          >
            <ContractsExecutionCenter
              savedProjects={savedProjects}
              onReviewProject={loadProject}
              onDeleteProject={deleteSavedProject}
              onMarkContractReady={markContractAsReady}
              onReturnContractToProduction={returnContractToProduction}
              onMarkContractCompleted={markContractAsCompleted}
              onReopenContract={reopenContractExecution}
            />
          </WorkspaceSectionShell>
        )}

        {/* ======================= إعدادات المؤسسة ======================= */}
        {activeTab === 'settings' && (
          <WorkspaceSectionShell
            eyebrow="الإدارة الفنية"
            title="إعدادات المؤسسة وقاعدة البيانات"
            description="كل ما يخص هوية الشركة والنسخ الاحتياطية والاستيراد والتصدير أصبح ضمن مركز إداري واحد بدل تشتيته في قوائم متفرقة."
            tabs={visibleAdminHubTabs}
            activeTab={activeTab}
            onChange={openAdminHub}
            summary={
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">اسم المؤسسة</div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {companySettings.name || 'غير محدد'}
                  </div>
                </div>
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">أصناف المستودع</div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {masterInventory.length.toLocaleString()} صنف
                  </div>
                </div>
                <div className="alu-panel rounded-[1.2rem] px-4 py-3">
                  <div className="text-[11px] font-black text-[var(--alu-text-soft)]">الأنظمة الفنية</div>
                  <div className="mt-1 text-sm font-black text-[var(--alu-text)]">
                    {profiles.length.toLocaleString()} نظام
                  </div>
                </div>
              </div>
            }
          >
            <div className="animate-in fade-in duration-500 max-w-5xl mx-auto space-y-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#4a6575]/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-[#4a6575]"></div>
              <h2 className="text-xl font-black text-[#314e60] mb-6 flex gap-2">
                <Boxes size={22} className="text-[#4a6575]" /> إدارة قواعد البيانات (BOM &
                Inventory)
              </h2>
              <p className="text-sm font-bold text-gray-500 mb-6">
                يمكنك تصدير الكتالوج والمستودع الحالي كملف لتثبيته في الأجهزة الأخرى، أو استيراد ملف
                جاهز (انتبه: الاستيراد يمسح البيانات الحالية).
              </p>
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  onClick={handleExportDatabase}
                  className="flex-1 p-4 bg-[#edf3f6] text-[#4a6575] rounded-xl font-black hover:bg-[#eceff2] transition-all flex items-center justify-center gap-3 border border-indigo-200"
                >
                  <Download size={20} /> تصدير قاعدة البيانات (.json)
                </button>
                <label className="flex-1 p-4 bg-white border-2 border-dashed border-[#4a6575] text-[#4a6575] rounded-xl font-black hover:bg-gray-50 transition-all flex items-center justify-center gap-3 cursor-pointer">
                  <Upload size={20} /> استيراد قاعدة بيانات جاهزة
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportDatabase}
                  />
                </label>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm">
              <h2 className="text-xl font-black text-[#314e60] mb-6 flex gap-2">
                <Palette size={22} className="text-[#4a6575]" /> مظهر البرنامج
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setCompanySettings((prev) => ({ ...prev, appTheme: 'default' }))}
                  className={`flex-1 p-4 rounded-3xl border-2 font-black ${companySettings.appTheme !== 'modern' ? 'border-[#4a6575] bg-[#edf3f6]' : 'border-gray-100'}`}
                >
                  الكلاسيكي
                </button>
                <button
                  onClick={() => setCompanySettings((prev) => ({ ...prev, appTheme: 'modern' }))}
                  className={`flex-1 p-4 rounded-3xl border-2 font-black ${companySettings.appTheme === 'modern' ? 'border-[#4a6575] bg-[#edf3f6]' : 'border-gray-100'}`}
                >
                  الحديث (Modern)
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8 border-b pb-6">
                <div className="p-3 bg-[#edf3f6] text-[#4a6575] rounded-2xl">
                  <Building2 size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#314e60]">الهوية البصرية والبيانات</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-3xl bg-gray-50">
                  <h3 className="font-bold text-gray-500 mb-4">شعار الشركة (للطباعة)</h3>
                  {companySettings.logo ? (
                    <img src={companySettings.logo} className="max-h-24 mb-4 rounded-lg" />
                  ) : (
                    <ImageIcon size={40} className="text-gray-300 mb-4" />
                  )}
                  <label className="cursor-pointer bg-[#4a6575] text-white px-4 py-2 rounded-xl font-bold">
                    تغيير الشعار
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </label>
                </div>

                <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-3xl bg-[#edf3f6]/30">
                  <h3 className="font-bold text-gray-500 mb-4">
                    أيقونة البرنامج (Favicon & App Icon)
                  </h3>
                  {companySettings.appIcon ? (
                    <img
                      src={companySettings.appIcon}
                      className="w-20 h-20 object-cover mb-4 rounded-2xl shadow-sm"
                    />
                  ) : (
                    <AppWindow size={40} className="text-gray-300 mb-4" />
                  )}
                  <label className="cursor-pointer bg-white border border-[#4a6575] text-[#4a6575] px-4 py-2 rounded-xl font-bold">
                    تغيير الأيقونة
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAppIconUpload}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">
                    اسم المؤسسة (يظهر في المتصفح والطباعة)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl font-bold"
                    value={companySettings.name || ''}
                    onChange={(e) =>
                      setCompanySettings((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">الجوال</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl font-bold"
                    value={companySettings.phone || ''}
                    onChange={(e) =>
                      setCompanySettings((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">الرقم الضريبي</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl font-bold"
                    value={companySettings.taxNumber || ''}
                    onChange={(e) =>
                      setCompanySettings((prev) => ({ ...prev, taxNumber: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">السجل التجاري</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl font-bold"
                    value={companySettings.crNumber || ''}
                    onChange={(e) =>
                      setCompanySettings((prev) => ({ ...prev, crNumber: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-gray-500">العنوان</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl font-bold"
                    value={companySettings.address || ''}
                    onChange={(e) =>
                      setCompanySettings((prev) => ({ ...prev, address: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          </WorkspaceSectionShell>
        )}
      </AppShell>

      {/* ======================= نافذة إضافة/تعديل نظام (الكتالوج الفيزيائي) ======================= */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-[#314e60]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl max-h-[95vh] rounded-[2rem] flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-[#F4F7FE] p-6 flex justify-between items-center">
              <h3 className="text-2xl font-black">
                {editingProfile ? 'تعديل النظام (التخصيم الفيزيائي)' : 'نظام جديد'}
              </h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="hover:text-red-500">
                <X size={24} />
              </button>
            </div>
            <div className="flex px-6 pt-4 border-b gap-6 bg-white">
              <button
                onClick={() => setProfileModalTab('basic')}
                className={`pb-3 font-black border-b-4 ${profileModalTab === 'basic' ? 'border-[#4a6575] text-[#4a6575]' : 'border-transparent text-gray-400 hover:text-[#4a6575]'}`}
              >
                1. الخصائص الأساسية
              </button>
              <button
                onClick={() => setProfileModalTab('formulas')}
                className={`pb-3 font-black border-b-4 ${profileModalTab === 'formulas' ? 'border-[#4a6575] text-[#4a6575]' : 'border-transparent text-gray-400 hover:text-[#4a6575]'}`}
              >
                2. الألمنيوم المطلوب
              </button>
              <button
                onClick={() => setProfileModalTab('glass')}
                className={`pb-3 font-black border-b-4 ${profileModalTab === 'glass' ? 'border-[#4a6575] text-[#4a6575]' : 'border-transparent text-gray-400 hover:text-[#4a6575]'}`}
              >
                3. الزجاج
              </button>
              <button
                onClick={() => setProfileModalTab('accessories')}
                className={`pb-3 font-black border-b-4 ${profileModalTab === 'accessories' ? 'border-[#4a6575] text-[#4a6575]' : 'border-transparent text-gray-400 hover:text-[#4a6575]'}`}
              >
                4. الإكسسوارات
              </button>
              <button
                onClick={() => setProfileModalTab('operations')}
                className={`pb-3 font-black border-b-4 ${profileModalTab === 'operations' ? 'border-[#4a6575] text-[#4a6575]' : 'border-transparent text-gray-400 hover:text-[#4a6575]'}`}
              >
                5. عمليات الورشة
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
              {profileModalTab === 'basic' && (
                <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-[#4a6575]"></div>
                    <h3 className="font-black text-[#314e60] text-xl border-b pb-4 mb-6">
                      البيانات الأساسية للقطاع
                    </h3>

                    <div className="rounded-2xl border border-[#4a6575]/15 bg-[#f7f9fc] p-5">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="text-sm font-black text-[#314e60]">حالة النظام الفني</span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black border ${profileFormValidation.errors.length === 0 ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}
                        >
                          {profileFormValidation.errors.length === 0
                            ? 'جاهز للحفظ'
                            : `يحتاج ${profileFormValidation.errors.length} معالجة`}
                        </span>
                        {profileFormValidation.warnings.length > 0 && (
                          <span className="px-3 py-1 rounded-full text-xs font-black border border-amber-200 bg-amber-50 text-amber-700">
                            {profileFormValidation.warnings.length} ملاحظات
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-gray-500">
                        عدد سطور الألمنيوم: {profileFormValidation.summary.aluminumCount}، الزجاج:{' '}
                        {profileFormValidation.summary.glassCount}، الإكسسوارات:{' '}
                        {profileFormValidation.summary.accessoriesCount}، العمليات:{' '}
                        {profileFormValidation.summary.operationsCount}
                      </p>
                      {profileFormValidation.errors.length > 0 && (
                        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
                          {profileFormValidation.errors.map((error) => (
                            <p key={error} className="text-sm font-black text-red-700">
                              {error}
                            </p>
                          ))}
                        </div>
                      )}
                      {profileFormValidation.warnings.length > 0 && (
                        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
                          {profileFormValidation.warnings.map((warning) => (
                            <p key={warning} className="text-sm font-bold text-amber-700">
                              {warning}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500">
                          اسم القطاع (مثال: سرايا 10 مفصلي)
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-[#F4F7FE] border border-transparent rounded-xl font-black text-[#314e60] outline-none focus:border-[#4a6575] transition-colors"
                          value={profileFormData.name || ''}
                          onChange={(e) =>
                            setProfileFormData((prev) => ({ ...prev, name: e.target.value }))
                          }
                          placeholder="أدخل اسم القطاع..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500">نوع النظام</label>
                        <select
                          className="w-full px-4 py-3 bg-[#F4F7FE] border border-transparent rounded-xl font-black text-[#314e60] outline-none focus:border-[#4a6575] transition-colors"
                          value={profileFormData.systemType || 'sliding'}
                          onChange={(e) =>
                            setProfileFormData((prev) => ({ ...prev, systemType: e.target.value }))
                          }
                        >
                          <option value="sliding">سحاب</option>
                          <option value="hinged">مفصلي</option>
                          <option value="fixed">ثابت</option>
                          <option value="facade">واجهة</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500">لون القطاع</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-[#F4F7FE] border border-transparent rounded-xl font-black text-[#314e60] outline-none focus:border-[#4a6575] transition-colors"
                          value={profileFormData.color || ''}
                          onChange={(e) =>
                            setProfileFormData((prev) => ({ ...prev, color: e.target.value }))
                          }
                          placeholder="مثال: فضي، شامبين، أسود..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500">
                          سماكة القاطع (التيوب) الافتراضية بالسم
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-blue-50 text-blue-800 border border-blue-100 rounded-xl font-black outline-none text-center focus:border-blue-400 transition-colors"
                          value={profileFormData.mullionThicknessCm ?? '4'}
                          onChange={(e) =>
                            setProfileFormData((prev) => ({
                              ...prev,
                              mullionThicknessCm: e.target.value
                            }))
                          }
                        />
                        <p className="text-[10px] text-gray-400 font-bold text-center mt-1">
                          تُستخدم لخصم القواطع في النوافذ المقسمة
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500">
                          هالك القص للزاوية (Miter Waste) بالسم
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-[#fbf4ea] text-orange-800 border border-orange-100 rounded-xl font-black outline-none text-center focus:border-orange-400 transition-colors"
                          value={profileFormData.miterWasteCm ?? '6.5'}
                          onChange={(e) =>
                            setProfileFormData((prev) => ({
                              ...prev,
                              miterWasteCm: e.target.value
                            }))
                          }
                        />
                        <p className="text-[10px] text-gray-400 font-bold text-center mt-1">
                          لتعويض مساحة نصل المنشار وقص الزوايا
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-dashed">
                      <h4 className="font-black text-[#314e60] mb-4">
                        خصومات النظام الهندسية الأساسية
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-500">
                            خصم عرض الإطار (سم)
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-700 outline-none text-center"
                            value={
                              profileFormData.physics?.frameDedW ??
                              defaultTechnicalSystemPhysics.frameDedW
                            }
                            onChange={(e) => updateProfilePhysics('frameDedW', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-500">
                            خصم طول الإطار (سم)
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-700 outline-none text-center"
                            value={
                              profileFormData.physics?.frameDedH ??
                              defaultTechnicalSystemPhysics.frameDedH
                            }
                            onChange={(e) => updateProfilePhysics('frameDedH', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-500">
                            خصم عرض الدرفة/البركلوز (سم)
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-700 outline-none text-center"
                            value={
                              profileFormData.physics?.sashDedW ??
                              defaultTechnicalSystemPhysics.sashDedW
                            }
                            onChange={(e) => updateProfilePhysics('sashDedW', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-500">
                            خصم طول الدرفة/البركلوز (سم)
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-700 outline-none text-center"
                            value={
                              profileFormData.physics?.sashDedH ??
                              defaultTechnicalSystemPhysics.sashDedH
                            }
                            onChange={(e) => updateProfilePhysics('sashDedH', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-dashed">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black text-[#314e60]">محاكاة سريعة للنظام الفني</h4>
                        <span className="text-xs font-black text-[#4a6575] bg-[#edf3f6] px-3 py-1 rounded-full">
                          قبل الاعتماد والإنتاج
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-[#F4F7FE] border border-transparent rounded-xl font-black text-[#314e60] outline-none text-center"
                          placeholder="العرض بالمتر"
                          value={profileSimulationInput.width || ''}
                          onChange={(e) => updateProfileSimulationField('width', e.target.value)}
                        />
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-[#F4F7FE] border border-transparent rounded-xl font-black text-[#314e60] outline-none text-center"
                          placeholder="الارتفاع بالمتر"
                          value={profileSimulationInput.height || ''}
                          onChange={(e) => updateProfileSimulationField('height', e.target.value)}
                        />
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-[#F4F7FE] border border-transparent rounded-xl font-black text-[#314e60] outline-none text-center"
                          placeholder="العدد"
                          value={profileSimulationInput.quantity || ''}
                          onChange={(e) => updateProfileSimulationField('quantity', e.target.value)}
                        />
                        <select
                          className="w-full px-4 py-3 bg-[#F4F7FE] border border-transparent rounded-xl font-black text-[#314e60] outline-none"
                          value={
                            profileSimulationInput.sections?.[0]?.type ||
                            (profileFormData.systemType === 'fixed' ? 'fixed' : 'sash')
                          }
                          onChange={(e) => updateProfileSimulationSection('type', e.target.value)}
                        >
                          <option value="sash">قسم متحرك</option>
                          <option value="fixed">قسم ثابت</option>
                        </select>
                      </div>

                      <div className="mt-5 grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-bold text-gray-500">قطع الألمنيوم</p>
                          <p className="text-2xl font-black text-[#314e60]">
                            {profileSimulationResult.pieces.length}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                          <p className="text-xs font-bold text-cyan-700">ألواح الزجاج</p>
                          <p className="text-2xl font-black text-cyan-900">
                            {profileSimulationResult.glass.length}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                          <p className="text-xs font-bold text-amber-700">بنود الإكسسوارات</p>
                          <p className="text-2xl font-black text-amber-900">
                            {profileSimulationResult.accessories.length}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                          <p className="text-xs font-bold text-emerald-700">عمليات الورشة</p>
                          <p className="text-2xl font-black text-emerald-900">
                            {profileSimulationResult.operations.length}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                          <p className="text-xs font-bold text-indigo-700">الأعواد التقديرية</p>
                          <p className="text-2xl font-black text-indigo-900">
                            {profileSimulationBarSummary.reduce(
                              (sum, item) => sum + item.barsCount,
                              0
                            )}
                          </p>
                        </div>
                      </div>

                      {profileSimulationResult.errors.length > 0 ? (
                        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
                          {profileSimulationResult.errors.map((error) => (
                            <p key={error} className="text-sm font-black text-red-700">
                              {error}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-5 grid grid-cols-1 lg:grid-cols-4 gap-4">
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <h5 className="font-black text-[#314e60] mb-3">ألمنيوم تجريبي</h5>
                            <div className="space-y-2 text-sm">
                              {profileSimulationResult.pieces.slice(0, 5).map((piece) => (
                                <div
                                  key={`${piece.label}-${piece.length}`}
                                  className="flex justify-between gap-3 border-b border-dashed pb-2 last:border-0"
                                >
                                  <span className="font-bold text-gray-600">{piece.label}</span>
                                  <span className="font-black text-[#314e60]">
                                    {piece.length} × {piece.quantity}
                                  </span>
                                </div>
                              ))}
                              {profileSimulationResult.pieces.length === 0 && (
                                <p className="font-bold text-gray-400">لا توجد قطع بعد.</p>
                              )}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-cyan-200 bg-white p-4">
                            <h5 className="font-black text-[#314e60] mb-3">زجاج تجريبي</h5>
                            <div className="space-y-2 text-sm">
                              {profileSimulationResult.glass.slice(0, 5).map((glassItem) => (
                                <div
                                  key={`${glassItem.label}-${glassItem.w}-${glassItem.h}`}
                                  className="flex justify-between gap-3 border-b border-dashed pb-2 last:border-0"
                                >
                                  <span className="font-bold text-gray-600">{glassItem.label}</span>
                                  <span className="font-black text-cyan-800">
                                    {glassItem.w} × {glassItem.h} × {glassItem.quantity}
                                  </span>
                                </div>
                              ))}
                              {profileSimulationResult.glass.length === 0 && (
                                <p className="font-bold text-gray-400">لا توجد ألواح زجاج بعد.</p>
                              )}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-amber-200 bg-white p-4">
                            <h5 className="font-black text-[#314e60] mb-3">إكسسوارات تجريبية</h5>
                            <div className="space-y-2 text-sm">
                              {profileSimulationResult.accessories.slice(0, 4).map((acc) => (
                                <div
                                  key={`${acc.name}-${acc.quantity}`}
                                  className="flex justify-between gap-3 border-b border-dashed pb-2 last:border-0"
                                >
                                  <span className="font-bold text-gray-600">{acc.name}</span>
                                  <span className="font-black text-amber-800">{acc.quantity}</span>
                                </div>
                              ))}
                              {profileSimulationResult.accessories.length === 0 && (
                                <p className="font-bold text-gray-400">لا توجد إكسسوارات بعد.</p>
                              )}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                            <h5 className="font-black text-[#314e60] mb-3">تشغيل وتجهيز</h5>
                            <div className="space-y-2 text-sm">
                              {profileSimulationResult.operations.slice(0, 4).map((operation) => (
                                <div
                                  key={`${operation.name}-${operation.quantity}`}
                                  className="flex justify-between gap-3 border-b border-dashed pb-2 last:border-0"
                                >
                                  <span className="font-bold text-gray-600">{operation.name}</span>
                                  <span className="font-black text-emerald-800">
                                    {operation.quantity} {operation.unitLabel}
                                  </span>
                                </div>
                              ))}
                              {profileSimulationBarSummary.slice(0, 3).map((bar) => (
                                <div
                                  key={`bar-${bar.itemName}`}
                                  className="flex justify-between gap-3 border-b border-dashed pb-2 last:border-0"
                                >
                                  <span className="font-bold text-gray-600">{bar.itemName}</span>
                                  <span className="font-black text-indigo-800">
                                    {bar.barsCount} عود
                                  </span>
                                </div>
                              ))}
                              {profileSimulationResult.operations.length === 0 &&
                                profileSimulationBarSummary.length === 0 && (
                                  <p className="font-bold text-gray-400">
                                    لا توجد بيانات تشغيل كافية بعد.
                                  </p>
                                )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {profileModalTab === 'formulas' && (
                <div className="space-y-4 max-w-6xl mx-auto">
                  <p className="text-sm font-bold text-gray-500 mb-4 bg-white p-3 rounded-lg border">
                    حدد لكل قطعة (الدور الذي تلعبه في النافذة) ثم أدخل الخصم الصافي لها (بالسالب -).
                    البرنامج سيقوم بالباقي!
                  </p>
                  {profileFormData.structuredFormulas.map((form, idx) => (
                    <div
                      key={form.id}
                      className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-white p-3 rounded-xl border shadow-sm relative"
                      style={{ zIndex: 100 - idx }}
                    >
                      <span className="w-8 h-8 shrink-0 bg-[#edf3f6] text-[#4a6575] rounded-full flex items-center justify-center font-black">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-[150px]">
                        <SearchableDropdown
                          items={masterInventory.filter((i) => i.category === 'aluminum')}
                          value={form.inventoryId}
                          onChange={(val) => updateFormula(form.id, 'inventoryId', val)}
                          placeholder="العود الخام..."
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="text"
                          placeholder="الرمز"
                          className="w-full px-3 py-2 bg-gray-50 rounded-lg outline-none font-bold text-sm border"
                          value={form.label || ''}
                          onChange={(e) => updateFormula(form.id, 'label', e.target.value)}
                        />
                      </div>
                      <div className="w-48">
                        <select
                          className="w-full px-2 py-2 bg-[#edf3f6] text-[#4a6575] rounded-lg outline-none font-black text-xs border border-indigo-100"
                          value={form.physicalRole || 'frame_w'}
                          onChange={(e) => updateFormula(form.id, 'physicalRole', e.target.value)}
                        >
                          <optgroup label="الأساسيات (الإطار)">
                            <option value="frame_w">حلق (عرض)</option>
                            <option value="frame_h">حلق (طول)</option>
                            <option value="mullion_w">قاطع (أفقي)</option>
                            <option value="mullion_h">قاطع (عمودي)</option>
                          </optgroup>
                          <optgroup label="القسم الثابت">
                            <option value="bead_fixed_w">بركلوز ثابت (عرض)</option>
                            <option value="bead_fixed_h">بركلوز ثابت (طول)</option>
                          </optgroup>
                          <optgroup label="القسم المتحرك">
                            <option value="sash_w">درفة (عرض)</option>
                            <option value="sash_h">درفة (طول)</option>
                            <option value="bead_sash_w">بركلوز درفة (عرض)</option>
                            <option value="bead_sash_h">بركلوز درفة (طول)</option>
                          </optgroup>
                        </select>
                      </div>
                      <div className="w-20">
                        <select
                          className="w-full px-1 py-2 bg-blue-50 text-blue-700 font-black rounded-lg outline-none text-xs text-center border border-blue-200"
                          value={form.divideBy || '1'}
                          onChange={(e) => updateFormula(form.id, 'divideBy', e.target.value)}
                        >
                          <option value="1">÷ 1</option>
                          <option value="2">÷ 2 (للسحاب)</option>
                          <option value="3">÷ 3</option>
                          <option value="4">÷ 4</option>
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="text"
                          placeholder="خصم سم"
                          className="w-full px-3 py-2 bg-[#fbf4ea] text-orange-700 font-black rounded-lg outline-none text-sm text-center border border-orange-200"
                          value={form.offsetCm || ''}
                          onChange={(e) => updateFormula(form.id, 'offsetCm', e.target.value)}
                        />
                      </div>{' '}
                      <div className="w-16">
                        <input
                          type="text"
                          placeholder="العدد"
                          className="w-full px-2 py-2 bg-gray-50 rounded-lg outline-none font-black text-sm text-center border"
                          value={form.qty || '1'}
                          onChange={(e) => updateFormula(form.id, 'qty', e.target.value)}
                        />
                      </div>
                      <div className="w-20">
                        <select
                          className="w-full px-2 py-2 bg-gray-50 rounded-lg outline-none font-black text-xs text-center border"
                          value={form.cutType || '45'}
                          onChange={(e) => updateFormula(form.id, 'cutType', e.target.value)}
                        >
                          <option value="45">45°</option>
                          <option value="90">90°</option>
                        </select>
                      </div>
                      <button
                        onClick={() =>
                          setProfileFormData((prev) => ({
                            ...prev,
                            structuredFormulas: prev.structuredFormulas.filter(
                              (f) => f.id !== form.id
                            )
                          }))
                        }
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setProfileFormData((prev) => ({
                        ...prev,
                        structuredFormulas: [
                          ...prev.structuredFormulas,
                          createDefaultProfileFormula()
                        ]
                      }))
                    }
                    className="w-full py-4 border-2 border-dashed border-[#4a6575]/40 text-[#4a6575] rounded-xl font-black flex justify-center items-center gap-2 hover:bg-[#edf3f6]"
                  >
                    <Plus size={20} /> إضافة قطعة
                  </button>
                </div>
              )}

              {profileModalTab === 'glass' && (
                <div className="space-y-4 max-w-6xl mx-auto">
                  {profileFormData.glassFormulas.map((glass, idx) => (
                    <div
                      key={glass.id}
                      className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-white p-3 rounded-xl border shadow-sm relative"
                      style={{ zIndex: 100 - idx }}
                    >
                      <div className="flex-1 min-w-[150px]">
                        <SearchableDropdown
                          items={masterInventory.filter((i) => i.category === 'glass')}
                          value={glass.inventoryId}
                          onChange={(val) => updateGlassFormula(glass.id, 'inventoryId', val)}
                          placeholder="لوح الزجاج..."
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="text"
                          placeholder="البيان"
                          className="w-full px-2 py-2 bg-gray-50 rounded-lg outline-none font-black text-xs text-center border"
                          value={glass.label || ''}
                          onChange={(e) => updateGlassFormula(glass.id, 'label', e.target.value)}
                        />
                      </div>
                      <div className="w-32">
                        <select
                          className="w-full px-2 py-2 bg-purple-50 text-purple-700 rounded-lg outline-none font-black text-xs border border-purple-100"
                          value={glass.physicalRole || 'glass_fixed'}
                          onChange={(e) =>
                            updateGlassFormula(glass.id, 'physicalRole', e.target.value)
                          }
                        >
                          <option value="glass_fixed">زجاج ثابت</option>
                          <option value="glass_sash">زجاج متحرك</option>
                        </select>
                      </div>

                      {/* 💡 أزرار قسمة العرض والطول للزجاج */}
                      <div className="w-20">
                        <select
                          className="w-full px-1 py-2 bg-blue-50 text-blue-700 font-black rounded-lg outline-none text-xs text-center border border-blue-200"
                          value={glass.divideW || '1'}
                          onChange={(e) => updateGlassFormula(glass.id, 'divideW', e.target.value)}
                        >
                          <option value="1">عرض ÷ 1</option>
                          <option value="2">عرض ÷ 2</option>
                          <option value="3">عرض ÷ 3</option>
                          <option value="4">عرض ÷ 4</option>
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="text"
                          placeholder="خصم العرض"
                          className="w-full px-2 py-2 bg-[#fbf4ea] text-orange-700 rounded-lg outline-none font-black text-xs text-center border border-orange-200"
                          value={glass.offsetW || ''}
                          onChange={(e) => updateGlassFormula(glass.id, 'offsetW', e.target.value)}
                        />
                      </div>

                      <div className="w-20">
                        <select
                          className="w-full px-1 py-2 bg-blue-50 text-blue-700 font-black rounded-lg outline-none text-xs text-center border border-blue-200"
                          value={glass.divideH || '1'}
                          onChange={(e) => updateGlassFormula(glass.id, 'divideH', e.target.value)}
                        >
                          <option value="1">طول ÷ 1</option>
                          <option value="2">طول ÷ 2</option>
                          <option value="3">طول ÷ 3</option>
                          <option value="4">طول ÷ 4</option>
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="text"
                          placeholder="خصم الطول"
                          className="w-full px-2 py-2 bg-[#fbf4ea] text-orange-700 rounded-lg outline-none font-black text-xs text-center border border-orange-200"
                          value={glass.offsetH || ''}
                          onChange={(e) => updateGlassFormula(glass.id, 'offsetH', e.target.value)}
                        />
                      </div>

                      <div className="w-16">
                        <input
                          type="text"
                          placeholder="العدد"
                          className="w-full px-2 py-2 bg-gray-50 rounded-lg outline-none font-black text-sm text-center border"
                          value={glass.qty || '1'}
                          onChange={(e) => updateGlassFormula(glass.id, 'qty', e.target.value)}
                        />
                      </div>
                      <button
                        onClick={() =>
                          setProfileFormData((prev) => ({
                            ...prev,
                            glassFormulas: prev.glassFormulas.filter((f) => f.id !== glass.id)
                          }))
                        }
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setProfileFormData((prev) => ({
                        ...prev,
                        glassFormulas: [...prev.glassFormulas, createDefaultGlassFormula()]
                      }))
                    }
                    className="w-full py-4 border-2 border-dashed border-[#4a6575]/40 text-[#4a6575] rounded-xl font-black flex justify-center items-center gap-2 hover:bg-[#edf3f6]"
                  >
                    <Plus size={20} /> إضافة زجاج
                  </button>
                </div>
              )}

              {profileModalTab === 'accessories' && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  <div className="rounded-xl border border-[#4a6575]/15 bg-white p-4">
                    <p className="text-sm font-bold text-gray-500">
                      يمكنك الآن تحديد طريقة احتساب الإكسسوار: لكل فتحة، لكل قسم، لكل متر
                      عرض/ارتفاع، أو حسب المحيط والمساحة.
                    </p>
                  </div>
                  {profileFormData.accessories.map((acc, idx) => (
                    <div
                      key={acc.id}
                      className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-white p-3 rounded-xl border shadow-sm relative"
                      style={{ zIndex: 100 - idx }}
                    >
                      <div className="flex-1">
                        <SearchableDropdown
                          items={masterInventory.filter((i) => i.category === 'accessory')}
                          value={acc.inventoryId}
                          onChange={(val) => {
                            updateAccessory(acc.id, 'inventoryId', val)
                            const selectedItem = masterInventory.find((i) => i.id === val)
                            if (selectedItem) updateAccessory(acc.id, 'name', selectedItem.name)
                          }}
                          placeholder="ابحث عن الإكسسوار..."
                        />
                      </div>
                      <div className="w-full md:w-52">
                        <select
                          className="w-full px-3 py-2.5 bg-amber-50 text-amber-700 rounded-lg outline-none font-black text-sm border border-amber-100"
                          value={acc.calcMode || 'per_opening'}
                          onChange={(e) => updateAccessory(acc.id, 'calcMode', e.target.value)}
                        >
                          {technicalAccessoryCalcModes.map((mode) => (
                            <option key={mode.value} value={mode.value}>
                              {mode.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full md:w-56">
                        <select
                          className="w-full px-3 py-2.5 bg-blue-50 text-blue-700 rounded-lg outline-none font-black text-sm border border-blue-100"
                          value={acc.sectionType || 'sash'}
                          onChange={(e) => updateAccessory(acc.id, 'sectionType', e.target.value)}
                        >
                          <option value="all">أساسيات النافذة (مع الإطار)</option>
                          <option value="fixed">ينزل مع القسم الثابت فقط</option>
                          <option value="sash">ينزل مع القسم المتحرك فقط</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="المعامل"
                        className="w-full md:w-32 px-3 py-2.5 bg-gray-50 rounded-lg outline-none font-black text-sm text-center border focus:border-gray-400"
                        value={acc.qtyPerWindow || '1'}
                        onChange={(e) => updateAccessory(acc.id, 'qtyPerWindow', e.target.value)}
                      />
                      <button
                        onClick={() =>
                          setProfileFormData((prev) => ({
                            ...prev,
                            accessories: prev.accessories.filter((a) => a.id !== acc.id)
                          }))
                        }
                        className="p-3 text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setProfileFormData((prev) => ({
                        ...prev,
                        accessories: [...prev.accessories, createDefaultAccessory()]
                      }))
                    }}
                    className="w-full py-4 bg-white border-2 border-dashed border-[#4a6575]/40 text-[#4a6575] rounded-xl font-black flex justify-center items-center gap-2 hover:bg-[#edf3f6] transition-all"
                  >
                    <Plus size={20} /> إضافة إكسسوار
                  </button>
                </div>
              )}

              {profileModalTab === 'operations' && (
                <div className="space-y-4 max-w-6xl mx-auto">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-sm font-bold text-emerald-800">
                      أضف هنا خطوات الورشة التي يجب أن تخرج مع هذا النظام: تجميع، تركيب إكسسوار،
                      تركيب زجاج، تشطيب، أو تغليف. هذه البنود ستظهر في المحاكاة وفي تقرير الفني
                      والتكلفة الداخلية.
                    </p>
                  </div>
                  {profileFormData.workshopOperations.map((operation, idx) => (
                    <div
                      key={operation.id}
                      className="space-y-3 bg-white p-4 rounded-2xl border shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 shrink-0 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            placeholder="اسم العملية"
                            className="w-72 px-3 py-2.5 bg-gray-50 rounded-lg outline-none font-black text-sm border"
                            value={operation.name || ''}
                            onChange={(e) =>
                              updateWorkshopOperation(operation.id, 'name', e.target.value)
                            }
                          />
                        </div>
                        <button
                          onClick={() =>
                            setProfileFormData((prev) => ({
                              ...prev,
                              workshopOperations: prev.workshopOperations.filter(
                                (item) => item.id !== operation.id
                              )
                            }))
                          }
                          className="p-3 text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <select
                          className="w-full px-3 py-2.5 bg-slate-50 rounded-lg outline-none font-black text-sm border"
                          value={operation.category || 'assembly'}
                          onChange={(e) =>
                            updateWorkshopOperation(operation.id, 'category', e.target.value)
                          }
                        >
                          {technicalOperationCategories.map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                        <select
                          className="w-full px-3 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg outline-none font-black text-sm border border-emerald-100"
                          value={operation.calcMode || 'per_opening'}
                          onChange={(e) =>
                            updateWorkshopOperation(operation.id, 'calcMode', e.target.value)
                          }
                        >
                          {technicalAccessoryCalcModes.map((mode) => (
                            <option key={mode.value} value={mode.value}>
                              {mode.label}
                            </option>
                          ))}
                        </select>
                        <select
                          className="w-full px-3 py-2.5 bg-blue-50 text-blue-700 rounded-lg outline-none font-black text-sm border border-blue-100"
                          value={operation.sectionType || 'all'}
                          onChange={(e) =>
                            updateWorkshopOperation(operation.id, 'sectionType', e.target.value)
                          }
                        >
                          <option value="all">على كامل العنصر</option>
                          <option value="fixed">على القسم الثابت فقط</option>
                          <option value="sash">على القسم المتحرك فقط</option>
                        </select>
                        <input
                          type="text"
                          placeholder="المعامل"
                          className="w-full px-3 py-2.5 bg-gray-50 rounded-lg outline-none font-black text-sm text-center border"
                          value={operation.qtyFactor || '1'}
                          onChange={(e) =>
                            updateWorkshopOperation(operation.id, 'qtyFactor', e.target.value)
                          }
                        />
                        <input
                          type="text"
                          placeholder="الوحدة"
                          className="w-full px-3 py-2.5 bg-gray-50 rounded-lg outline-none font-black text-sm text-center border"
                          value={operation.unitLabel || 'عملية'}
                          onChange={(e) =>
                            updateWorkshopOperation(operation.id, 'unitLabel', e.target.value)
                          }
                        />
                        <input
                          type="text"
                          placeholder="تكلفة الوحدة"
                          className="w-full px-3 py-2.5 bg-[#fbf4ea] text-orange-700 rounded-lg outline-none font-black text-sm text-center border border-orange-200"
                          value={operation.costPerUnit ?? ''}
                          onChange={(e) =>
                            updateWorkshopOperation(operation.id, 'costPerUnit', e.target.value)
                          }
                        />
                      </div>

                      <textarea
                        rows={2}
                        placeholder="ملاحظات التنفيذ للفني أو الورشة"
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none font-bold text-sm border resize-none"
                        value={operation.notes || ''}
                        onChange={(e) =>
                          updateWorkshopOperation(operation.id, 'notes', e.target.value)
                        }
                      />
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setProfileFormData((prev) => ({
                        ...prev,
                        workshopOperations: [
                          ...(prev.workshopOperations || []),
                          createDefaultTechnicalOperation()
                        ]
                      }))
                    }
                    className="w-full py-4 bg-white border-2 border-dashed border-emerald-300 text-emerald-700 rounded-xl font-black flex justify-center items-center gap-2 hover:bg-emerald-50 transition-all"
                  >
                    <Plus size={20} /> إضافة عملية ورشة
                  </button>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-white">
              <button
                onClick={handleSaveProfile}
                className="w-full py-4 bg-[#4a6575] text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all"
              >
                حفظ القطاع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة استيراد من الفني */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-[#314e60]/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">ربط مقاسات الفني</h3>
              <button onClick={() => setIsImportModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              {Object.keys(importMapping).map((sysType) => (
                <div
                  key={sysType}
                  className="flex justify-between items-center bg-gray-50 p-4 rounded-xl"
                >
                  <span className="font-bold">
                    {sysType === 'sliding' ? 'سحاب' : sysType === 'hinged' ? 'مفصلي' : 'ثابت'}
                  </span>
                  <select
                    className="px-4 py-2 border rounded-xl outline-none w-1/2 font-bold"
                    value={importMapping[sysType] || ''}
                    onChange={(e) =>
                      setImportMapping((prev) => ({ ...prev, [sysType]: e.target.value }))
                    }
                  >
                    <option value="">- اختر القطاع -</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <button
              onClick={processImportedData}
              className="w-full py-4 bg-[#4a6575] text-white rounded-xl font-black"
            >
              استيراد
            </button>
          </div>
        </div>
      )}

      {/* نافذة الدفعات */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-[#314e60]/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl">
            <div className="flex justify-between mb-6">
              <h3 className="text-xl font-black">الدفعات</h3>
              <button onClick={() => setIsPaymentModalOpen(false)}>
                <X />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="المبلغ"
                className="w-full p-3 border rounded-xl outline-none focus:border-green-500 font-bold"
                value={newPayment.amount || ''}
                onChange={(e) => setNewPayment((prev) => ({ ...prev, amount: e.target.value }))}
              />
              <input
                type="text"
                placeholder="ملاحظات"
                className="w-full p-3 border rounded-xl outline-none font-bold"
                value={newPayment.note || ''}
                onChange={(e) => setNewPayment((prev) => ({ ...prev, note: e.target.value }))}
              />
              <button
                onClick={addPayment}
                className="w-full p-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all"
              >
                إضافة الدفعة
              </button>
            </div>
            <div className="space-y-2">
              {projectInfo.payments?.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <span className="font-bold">{p.amount} ر.س</span>
                  <button onClick={() => deletePayment(p.id)} className="text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================= نافذة التأكيد الذكية (Confirm Modal) ======================= */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-[#314e60]/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-[#314e60] mb-4">تأكيد الإجراء</h3>
              <p className="text-gray-600 font-bold mb-8 whitespace-pre-line leading-relaxed">
                {confirmDialog.message}
              </p>
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => {
                    confirmDialog.onConfirm()
                    setConfirmDialog({ isOpen: false, message: '', onConfirm: null })
                  }}
                  className="flex-1 py-4 bg-red-500 text-white rounded-xl font-black hover:bg-red-600 transition-all shadow-lg shadow-red-500/30 active:scale-95"
                >
                  نعم، متأكد
                </button>
                <button
                  onClick={() => setConfirmDialog({ isOpen: false, message: '', onConfirm: null })}
                  className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-black hover:bg-gray-200 transition-all active:scale-95"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        input, textarea, select {
          user-select: text !important;
          cursor: text !important;
          pointer-events: auto !important;
        }

        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        
        @media print {
          @page { 
             size: A4; 
             margin: 12mm; 
          }
          body, html, #root { 
             background: white !important; 
             width: 100% !important; 
             height: auto !important;
             max-width: 100% !important;
             margin: 0 !important; 
             padding: 0 !important; 
             overflow: visible !important;
          }
          header, aside, .print\\:hidden { display: none !important; }
          .page-break-after { page-break-after: always !important; }
          .page-break-inside-avoid { page-break-inside: avoid !important; break-inside: avoid !important; }
          textarea { resize: none !important; border: none !important; overflow: hidden !important; }
          * { 
             -webkit-print-color-adjust: exact !important; 
             print-color-adjust: exact !important; 
             box-sizing: border-box !important; 
          }
          
          .print-wrapper, .print-content, main, .overflow-y-auto, .flex-1, .h-screen, .h-full { 
             width: 100% !important; 
             max-width: 100% !important; 
             height: auto !important; 
             max-height: none !important;
             min-height: 0 !important;
             margin: 0 !important; 
             padding: 0 !important; 
             overflow: visible !important; 
             display: block !important;
             position: static !important;
          }
          
          table { width: 100% !important; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
      `}</style>
    </>
  )
}

export default App
