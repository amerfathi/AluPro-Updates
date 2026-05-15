export const createCompatibilityInventoryFixture = () => [
  {
    id: 'alu-frame-main',
    category: 'aluminum',
    name: 'Frame profile',
    stockQty: 20,
    length: 5.8,
    price: 120
  },
  {
    id: 'alu-sash-main',
    category: 'aluminum',
    name: 'Sash profile',
    stockQty: 20,
    length: 5.8,
    price: 110
  },
  {
    id: 'glass-6',
    category: 'glass',
    name: 'Clear glass 6 mm',
    stockQty: 100,
    price: 50
  },
  {
    id: 'glass-32',
    category: 'glass',
    name: 'Clear glass 32 mm',
    stockQty: 40,
    price: 90
  },
  {
    id: 'acc-roller',
    category: 'accessory',
    name: 'Sliding roller hardware',
    stockQty: 300,
    price: 8
  },
  {
    id: 'acc-right-handle',
    category: 'accessory',
    name: 'Right handle lock',
    stockQty: 200,
    price: 12
  },
  {
    id: 'acc-gasket',
    category: 'accessory',
    name: 'Rubber gasket',
    stockQty: 500,
    price: 2
  }
]

export const createCompatibilitySystemFixture = ({
  id = 'system-compat-fixture',
  name = 'Compatibility Fixture System',
  systemType = 'sliding',
  glassInventoryId = 'glass-6',
  accessories = null
} = {}) => ({
  id,
  name,
  systemType,
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
      id: 1001,
      label: 'Frame width',
      qty: 2,
      cutType: '45',
      inventoryId: 'alu-frame-main',
      physicalRole: 'frame_w',
      divideBy: 1,
      offsetCm: 0
    },
    {
      id: 1002,
      label: 'Frame height',
      qty: 2,
      cutType: '45',
      inventoryId: 'alu-frame-main',
      physicalRole: 'frame_h',
      divideBy: 1,
      offsetCm: 0
    },
    {
      id: 1003,
      label: 'Sash width',
      qty: 2,
      cutType: '45',
      inventoryId: 'alu-sash-main',
      physicalRole: 'sash_w',
      divideBy: 1,
      offsetCm: -1
    }
  ],
  glassFormulas: [
    {
      id: 2001,
      label: 'Main glass',
      qty: 1,
      inventoryId: glassInventoryId,
      physicalRole: systemType === 'fixed' ? 'glass_fixed' : 'glass_sash',
      divideW: 1,
      offsetW: 0,
      divideH: 1,
      offsetH: 0
    }
  ],
  accessories: accessories || [
    {
      id: 'fixture-accessory-1',
      name: 'Sliding roller hardware',
      qtyPerWindow: 2,
      inventoryId: 'acc-roller',
      calcMode: 'per_opening',
      sectionType: 'sash'
    },
    {
      id: 'fixture-accessory-2',
      name: 'Rubber gasket',
      qtyPerWindow: 6,
      inventoryId: 'acc-gasket',
      calcMode: 'per_perimeter',
      sectionType: 'all'
    }
  ],
  workshopOperations: []
})

export const createOpeningFixture = (overrides = {}) => ({
  width: '1.60',
  height: '1.40',
  quantity: '1',
  label: 'Fixture opening',
  isComplex: false,
  direction: 'right',
  sashType: 'sliding',
  sections: [{ id: 1, type: 'sash', h: '' }],
  ...overrides
})
