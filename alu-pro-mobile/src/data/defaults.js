const getToday = () => new Date().toLocaleDateString()

export const createDefaultCompanySettings = () => ({
  name: 'Ultra Frame - الترا فريم',
  taxNumber: '',
  crNumber: '',
  address: '',
  phone: '',
  logo: '',
  appIcon: '',
  appTheme: 'default'
})

export const createDefaultInventory = () => [
  {
    id: 'item_101',
    category: 'aluminum',
    name: 'عود حلق سحاب 10سم (فضي)',
    price: 120,
    stockQty: 50,
    length: 5.8
  },
  {
    id: 'item_102',
    category: 'aluminum',
    name: 'عود درفة كعب (فضي)',
    price: 95,
    stockQty: 30,
    length: 5.8
  },
  {
    id: 'item_103',
    category: 'aluminum',
    name: 'عود درفة جنب (فضي)',
    price: 90,
    stockQty: 20,
    length: 5.8
  },
  {
    id: 'item_104',
    category: 'aluminum',
    name: 'عود درفة شنكل (فضي)',
    price: 105,
    stockQty: 10,
    length: 5.8
  },
  {
    id: 'item_105',
    category: 'aluminum',
    name: 'عود تيوب قاطع (فضي)',
    price: 80,
    stockQty: 10,
    length: 6.0
  },
  {
    id: 'item_106',
    category: 'aluminum',
    name: 'عود باكيت زجاج (فضي)',
    price: 20,
    stockQty: 60,
    length: 6.0
  },
  { id: 'item_201', category: 'accessory', name: 'كفرات سحاب دبل', price: 5, stockQty: 200 },
  { id: 'item_202', category: 'accessory', name: 'مسكة مخفية', price: 15, stockQty: 150 },
  { id: 'item_203', category: 'accessory', name: 'كاوتش زجاج (رول)', price: 2, stockQty: 500 },
  { id: 'item_301', category: 'glass', name: 'زجاج شفاف 6 ملم', price: 65, stockQty: 1000 }
]

export const createDefaultProfiles = () => [
  {
    id: 1,
    name: 'سحاب 10سم (جامبو)',
    systemType: 'sliding',
    color: 'فضي',
    miterWasteCm: 6.5,
    mullionThicknessCm: 4,
    physics: {
      frameDedW: 5,
      frameDedH: 5,
      sashDedW: 12,
      sashDedH: 12
    },
    structuredFormulas: [
      {
        id: 101,
        label: 'حلق عرض',
        baseDim: 'W',
        divideBy: 1,
        offsetCm: 0,
        qty: 2,
        cutType: '45',
        inventoryId: 'item_101',
        physicalRole: 'frame_w'
      },
      {
        id: 102,
        label: 'حلق ارتفاع',
        baseDim: 'H',
        divideBy: 1,
        offsetCm: 0,
        qty: 2,
        cutType: '45',
        inventoryId: 'item_101',
        physicalRole: 'frame_h'
      },
      {
        id: 103,
        label: 'درفة كعب',
        baseDim: 'W',
        divideBy: 2,
        offsetCm: 3,
        qty: 4,
        cutType: '45',
        inventoryId: 'item_102',
        physicalRole: 'sash_w'
      },
      {
        id: 104,
        label: 'درفة جنب',
        baseDim: 'H',
        divideBy: 1,
        offsetCm: -5,
        qty: 2,
        cutType: '45',
        inventoryId: 'item_103',
        physicalRole: 'sash_h'
      },
      {
        id: 105,
        label: 'درفة شنكل',
        baseDim: 'H',
        divideBy: 1,
        offsetCm: -5,
        qty: 2,
        cutType: '45',
        inventoryId: 'item_104',
        physicalRole: 'sash_h'
      },
      {
        id: 106,
        label: 'تيوب قاطع',
        baseDim: 'W',
        divideBy: 1,
        offsetCm: -3,
        qty: 1,
        cutType: '90',
        inventoryId: 'item_105',
        physicalRole: 'mullion_w'
      },
      {
        id: 107,
        label: 'باكيت',
        baseDim: 'W',
        divideBy: 1,
        offsetCm: -10,
        qty: 2,
        cutType: '45',
        inventoryId: 'item_106',
        physicalRole: 'bead_sash_w'
      },
      {
        id: 108,
        label: 'باكيت',
        baseDim: 'H',
        divideBy: 1,
        offsetCm: -10,
        qty: 2,
        cutType: '45',
        inventoryId: 'item_106',
        physicalRole: 'bead_sash_h'
      }
    ],
    accessories: [
      {
        id: 201,
        name: 'كفرات سحاب',
        qtyPerWindow: 4,
        inventoryId: 'item_201',
        sectionType: 'sash'
      },
      {
        id: 202,
        name: 'مسكة مخفية',
        qtyPerWindow: 2,
        inventoryId: 'item_202',
        sectionType: 'sash'
      },
      {
        id: 203,
        name: 'كاوتش (متر)',
        qtyPerWindow: 6,
        inventoryId: 'item_203',
        sectionType: 'all'
      }
    ],
    workshopOperations: [
      {
        id: 401,
        name: 'تجميع الحلوق',
        category: 'assembly',
        qtyFactor: 1,
        calcMode: 'per_opening',
        sectionType: 'all',
        unitLabel: 'عملية',
        costPerUnit: 35,
        notes: 'قص وتجميع الزوايا وضبط الحلوق قبل التركيب.'
      },
      {
        id: 402,
        name: 'تركيب الدرف السحابة',
        category: 'hardware',
        qtyFactor: 1,
        calcMode: 'per_section',
        sectionType: 'sash',
        unitLabel: 'درفة',
        costPerUnit: 18,
        notes: 'يشمل تركيب الكفرات والمساكات وضبط الحركة.'
      },
      {
        id: 403,
        name: 'تركيب الزجاج والمعايرة',
        category: 'glazing',
        qtyFactor: 1,
        calcMode: 'per_section',
        sectionType: 'sash',
        unitLabel: 'قسم',
        costPerUnit: 12,
        notes: 'تركيب الزجاج والباكيت والمعايرة النهائية.'
      }
    ],
    glassFormulas: [
      {
        id: 301,
        label: 'زجاج درفة سحاب',
        divideW: 2,
        offsetW: -12,
        divideH: 1,
        offsetH: -16,
        qty: 2,
        type: 'سنجل 6 ملم شفاف',
        inventoryId: 'item_301',
        physicalRole: 'glass_sash'
      }
    ]
  }
]

export const createDefaultContractItem = (id = 1) => ({
  id,
  name: '',
  qty: '',
  sqm: '',
  pricePerSqm: ''
})

export const createDefaultProjectInfo = () => ({
  id: null,
  clientName: '',
  phone: '',
  projectType: '',
  date: getToday(),
  payments: [],
  contractItems: [createDefaultContractItem()],
  applyTax: false,
  taxRate: 15
})

export const createDefaultPaymentDraft = () => ({
  amount: '',
  date: getToday(),
  note: ''
})

export const createDefaultQuoteColumns = () => [
  { id: 'col_name', label: 'الصنف والبيان', visible: true, isCustom: false },
  { id: 'col_details', label: 'التفاصيل والمواصفات', visible: true, isCustom: false },
  { id: 'col_qty', label: 'الكمية', visible: true, isCustom: false },
  { id: 'col_price', label: 'سعر الوحدة', visible: true, isCustom: false }
]

export const createDefaultQuoteConfig = () => ({
  columns: createDefaultQuoteColumns(),
  discount: '',
  taxRate: '15',
  notes: 'الأسعار أعلاه خاضعة للمراجعة. العرض صالح لمدة 15 يوماً.',
  quoteDate: getToday()
})

export const createDefaultQuoteItem = (id = 1) => ({
  id,
  col_name: '',
  col_details: '',
  col_qty: '',
  col_price: '',
  isHidden: false
})

export const createDefaultQuoteItems = () => [createDefaultQuoteItem()]

export const createDefaultProfileFormData = () => ({
  name: '',
  systemType: 'sliding',
  color: 'فضي',
  miterWasteCm: 6.5,
  mullionThicknessCm: 4,
  physics: {
    frameDedW: '5',
    frameDedH: '5',
    sashDedW: '12',
    sashDedH: '12'
  },
  structuredFormulas: [],
  accessories: [],
  glassFormulas: [],
  workshopOperations: []
})

export const createDefaultProfileFormula = () => ({
  id: Date.now() + Math.random(),
  label: '',
  qty: '1',
  cutType: '45',
  inventoryId: '',
  physicalRole: 'sash_w',
  divideBy: '1',
  offsetCm: ''
})

export const createDefaultGlassFormula = () => ({
  id: Date.now() + Math.random(),
  label: 'زجاج',
  qty: '1',
  inventoryId: '',
  physicalRole: 'glass_fixed',
  divideW: '1',
  offsetW: '',
  divideH: '1',
  offsetH: ''
})

export const createDefaultAccessory = () => ({
  id: Date.now() + Math.random(),
  name: 'إكسسوار',
  qtyPerWindow: '1',
  inventoryId: '',
  calcMode: 'per_opening',
  sectionType: 'sash'
})

export const createDefaultTechnicalOperation = () => ({
  id: Date.now() + Math.random(),
  name: 'عملية ورشة',
  category: 'assembly',
  qtyFactor: '1',
  calcMode: 'per_opening',
  sectionType: 'all',
  unitLabel: 'عملية',
  costPerUnit: '',
  notes: ''
})

export const createDefaultWindowSection = (id = 1, type = 'sash') => ({
  id,
  type,
  h: ''
})

export const createDefaultWindowInput = () => ({
  width: '2.00',
  height: '2.00',
  quantity: '1',
  label: 'نافذة 1',
  isComplex: false,
  sections: [createDefaultWindowSection()]
})

export const createDefaultGlassRawSheet = () => ({
  w: '321',
  h: '225',
  blade: '0.3',
  label: 'لوح زجاج جامبو'
})

export const createDefaultGlassPiece = () => ({
  w: '',
  h: '',
  qty: '1',
  label: 'زجاج نافذة'
})

export const createDefaultInventoryItem = () => ({
  name: '',
  price: '',
  stockQty: '',
  length: '5.8'
})
