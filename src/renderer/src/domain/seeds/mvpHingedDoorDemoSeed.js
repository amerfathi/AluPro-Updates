import { InterfaceDefinition } from '../profile/InterfaceDefinition.js'
import { ProfileFamily } from '../profile/ProfileFamily.js'
import { ProfileGeometry } from '../profile/ProfileGeometry.js'
import { ProfileVariant } from '../profile/ProfileVariant.js'
import { Accessory } from '../materials/Accessory.js'
import { CompatibilityRule } from '../rules/CompatibilityRule.js'
import { CompatibilityConstraintRule } from '../rules/compatibility/CompatibilityConstraintRule.js'
import { CompatibilityRulesEngine } from '../rules/compatibility/CompatibilityRulesEngine.js'
import { CutRule } from '../rules/CutRule.js'
import { MachiningTemplate } from '../machining/MachiningTemplate.js'
import { System } from '../system/System.js'

export const MVP_DEMO_SEED_ID = 'demo-mvp-hinged-door-v1'

export const mvpDemoDataNotice =
  'Demo data only. Values are realistic for testing and onboarding, not for direct production purchasing.'

export const createMvpDemoInventory = () => [
  {
    id: 'demo-alu-frame-45',
    category: 'aluminum',
    name: 'Demo Frame Profile 45mm - 6.0m',
    stockQty: 120,
    length: 6.0,
    price: 138
  },
  {
    id: 'demo-alu-sash-40',
    category: 'aluminum',
    name: 'Demo Sash Profile 40mm - 6.0m',
    stockQty: 90,
    length: 6.0,
    price: 129
  },
  {
    id: 'demo-alu-bead-18',
    category: 'aluminum',
    name: 'Demo Glazing Bead 18mm - 6.0m',
    stockQty: 160,
    length: 6.0,
    price: 54
  },
  {
    id: 'demo-glass-clear-8mm',
    category: 'glass',
    name: 'Demo Tempered Glass Clear 8mm',
    stockQty: 250,
    price: 112
  },
  {
    id: 'demo-acc-lock-mortise',
    category: 'accessory',
    name: 'Demo Mortise Lock 85mm',
    stockQty: 40,
    price: 78
  },
  {
    id: 'demo-acc-hinge-3d',
    category: 'accessory',
    name: 'Demo 3D Adjustable Hinge Set',
    stockQty: 160,
    price: 24
  },
  {
    id: 'demo-acc-gasket-epdm',
    category: 'accessory',
    name: 'Demo EPDM Gasket Roll',
    stockQty: 500,
    price: 4
  }
]

export const createMvpDemoFrameFamily = () =>
  new ProfileFamily({
    id: 'door',
    name: 'Door Frame Family',
    description: 'Demo family for hinged door frame profiles.'
  })

export const createMvpDemoSashFamily = () =>
  new ProfileFamily({
    id: 'casement',
    name: 'Hinged Sash Family',
    description: 'Demo family for hinged sash profiles.'
  })

export const createMvpDemoProfileGeometry = () =>
  new ProfileGeometry({
    id: 'demo-geometry-hinged-door',
    zones: ['frame_w', 'frame_h', 'sash_w', 'sash_h', 'bead_sash_w', 'bead_sash_h', 'glass_sash'],
    interfaces: [
      new InterfaceDefinition({
        id: 'demo-if-frame-sash-hinge',
        sourceZone: 'frame_h',
        targetZone: 'sash_h',
        joinType: 'hinge',
        constraints: {
          recommendedClearanceMm: 3
        },
        description: 'Hinged sash connects to frame jamb with hinge set.'
      }),
      new InterfaceDefinition({
        id: 'demo-if-bead-glass',
        sourceZone: 'bead_sash_w',
        targetZone: 'glass_sash',
        joinType: 'gasket',
        constraints: {
          gasketRequired: true
        },
        description: 'Glazing bead and EPDM gasket retain insulated glass in sash.'
      })
    ],
    depthMm: 45,
    wallThicknessMm: 1.6,
    metadata: {
      seedType: 'demo',
      notes: mvpDemoDataNotice
    }
  })

export const createMvpDemoAccessories = () => [
  new Accessory({
    id: 'demo-lock-1',
    name: 'Demo Mortise Lock',
    inventoryId: 'demo-acc-lock-mortise',
    qtyPerWindow: 1,
    calcMode: 'per_opening',
    sectionType: 'sash',
    compatibleZones: ['sash_h']
  }),
  new Accessory({
    id: 'demo-hinge-set-1',
    name: 'Demo Hinge Set',
    inventoryId: 'demo-acc-hinge-3d',
    qtyPerWindow: 3,
    calcMode: 'per_opening',
    sectionType: 'sash',
    compatibleZones: ['sash_h']
  }),
  new Accessory({
    id: 'demo-gasket-1',
    name: 'Demo EPDM Gasket',
    inventoryId: 'demo-acc-gasket-epdm',
    qtyPerWindow: 1.1,
    calcMode: 'per_perimeter',
    sectionType: 'all',
    compatibleZones: ['bead_sash_w', 'bead_sash_h']
  })
]

export const createMvpDemoDomainSystem = () => {
  const frameFamily = createMvpDemoFrameFamily()
  const sashFamily = createMvpDemoSashFamily()
  const geometry = createMvpDemoProfileGeometry()
  const accessories = createMvpDemoAccessories()

  const variant = new ProfileVariant({
    id: 'demo-variant-hinged-door-45',
    name: 'Demo Hinged Door Variant 45/40',
    family: sashFamily,
    geometry,
    physics: {
      frameDedW: 5,
      frameDedH: 5,
      sashDedW: 10,
      sashDedH: 10
    },
    accessories,
    structuredFormulas: [],
    glassFormulas: [],
    workshopOperations: [],
    metadata: {
      seedType: 'demo',
      frameFamilyId: frameFamily.id,
      notes: mvpDemoDataNotice
    }
  })

  return new System({
    id: MVP_DEMO_SEED_ID,
    name: 'Demo Hinged Door System',
    family: frameFamily,
    variants: [variant],
    compatibilityRules: [
      new CompatibilityRule({
        id: 'demo-allow-sash-accessories',
        name: 'Allow sash accessories on door/casement setup',
        scope: 'profile-accessory',
        effect: 'allow',
        priority: 20,
        conditions: {
          profileFamily: ['door', 'casement'],
          sectionType: ['sash', 'all']
        },
        message: 'Sash and all-section accessories are valid in this demo system.'
      })
    ],
    metadata: {
      seedType: 'demo',
      notes: mvpDemoDataNotice
    }
  })
}

export const createMvpDemoLegacySystem = () => ({
  id: MVP_DEMO_SEED_ID,
  name: 'Demo Hinged Door Technical System',
  systemType: 'casement',
  profileFamily: 'door',
  color: 'demo-anodized-natural',
  miterWasteCm: 6.5,
  mullionThicknessCm: 4.0,
  physics: {
    frameDedW: 5,
    frameDedH: 5,
    sashDedW: 10,
    sashDedH: 10
  },
  structuredFormulas: [
    {
      id: 1101,
      label: 'Demo frame width',
      qty: 2,
      cutType: '45',
      inventoryId: 'demo-alu-frame-45',
      physicalRole: 'frame_w',
      divideBy: 1,
      offsetCm: 0
    },
    {
      id: 1102,
      label: 'Demo frame height',
      qty: 2,
      cutType: '45',
      inventoryId: 'demo-alu-frame-45',
      physicalRole: 'frame_h',
      divideBy: 1,
      offsetCm: 0
    },
    {
      id: 1103,
      label: 'Demo sash width',
      qty: 2,
      cutType: '45',
      inventoryId: 'demo-alu-sash-40',
      physicalRole: 'sash_w',
      divideBy: 1,
      offsetCm: -1
    },
    {
      id: 1104,
      label: 'Demo sash height',
      qty: 2,
      cutType: '45',
      inventoryId: 'demo-alu-sash-40',
      physicalRole: 'sash_h',
      divideBy: 1,
      offsetCm: -1
    },
    {
      id: 1105,
      label: 'Demo bead width',
      qty: 2,
      cutType: '45',
      inventoryId: 'demo-alu-bead-18',
      physicalRole: 'bead_sash_w',
      divideBy: 1,
      offsetCm: -1
    },
    {
      id: 1106,
      label: 'Demo bead height',
      qty: 2,
      cutType: '45',
      inventoryId: 'demo-alu-bead-18',
      physicalRole: 'bead_sash_h',
      divideBy: 1,
      offsetCm: -1
    }
  ],
  accessories: [
    {
      id: 'demo-lock-1',
      name: 'Demo Mortise Lock',
      qtyPerWindow: 1,
      inventoryId: 'demo-acc-lock-mortise',
      calcMode: 'per_opening',
      sectionType: 'sash'
    },
    {
      id: 'demo-hinge-set-1',
      name: 'Demo Hinge Set',
      qtyPerWindow: 3,
      inventoryId: 'demo-acc-hinge-3d',
      calcMode: 'per_opening',
      sectionType: 'sash'
    },
    {
      id: 'demo-gasket-1',
      name: 'Demo EPDM Gasket',
      qtyPerWindow: 1.1,
      inventoryId: 'demo-acc-gasket-epdm',
      calcMode: 'per_perimeter',
      sectionType: 'all'
    }
  ],
  glassFormulas: [
    {
      id: 2101,
      label: 'Demo tempered glass sash panel',
      qty: 1,
      inventoryId: 'demo-glass-clear-8mm',
      physicalRole: 'glass_sash',
      divideW: 1,
      offsetW: -0.9,
      divideH: 1,
      offsetH: -0.9,
      thicknessMm: 8
    }
  ],
  workshopOperations: [
    {
      id: 'demo-op-1',
      name: 'Demo final fitting',
      category: 'assembly',
      qtyFactor: 1,
      calcMode: 'per_opening',
      sectionType: 'all',
      unitLabel: 'operation',
      costPerUnit: 22,
      notes: 'Demo labor row to keep compatibility with current operation flow.'
    }
  ]
})

export const createMvpDemoOpening = () => ({
  id: 'demo-opening-hinged-door-1',
  width: '1.00',
  height: '2.20',
  quantity: '1',
  label: 'Demo Door Leaf A',
  sashType: 'casement',
  openingDirection: 'right',
  isComplex: false,
  sections: [{ id: 1, type: 'sash', h: '' }]
})

export const createMvpDemoGlazingRule = () =>
  Object.freeze({
    id: 'demo-glazing-rule-casement-01',
    name: 'Demo glazing thickness and role rule',
    profileFamily: 'casement',
    glassRole: 'glass_sash',
    minThicknessMm: 6,
    maxThicknessMm: 24,
    defaultEdgeClearanceMm: 9,
    notes: 'Demo rule used for validation in test scenarios.'
  })

export const isMvpDemoGlassThicknessAllowed = ({ thicknessMm, glazingRule }) => {
  const rule = glazingRule || createMvpDemoGlazingRule()
  const thickness = Number(thicknessMm)
  if (!Number.isFinite(thickness)) return false
  return thickness >= rule.minThicknessMm && thickness <= rule.maxThicknessMm
}

export const createMvpDemoCompatibilityRules = () => [
  new CompatibilityConstraintRule({
    id: 'demo-frame-accepts-casement-sash',
    name: 'Demo frame allows casement or mixed sash mode',
    target: 'system',
    severity: 'error',
    priority: 10,
    when: {
      frameProfileType: ['door', 'casement']
    },
    assertions: [
      {
        field: 'sashType',
        operator: 'in',
        value: ['casement', 'mixed'],
        message: 'Demo frame profile is configured for hinged sash behavior only.'
      }
    ]
  }),
  new CompatibilityConstraintRule({
    id: 'demo-lock-and-hinge-family-restriction',
    name: 'Demo lock/hinge accessories only for door or casement family',
    target: 'accessory',
    severity: 'error',
    priority: 20,
    when: {
      accessoryType: ['lock', 'hinge']
    },
    assertions: [
      {
        field: 'profileFamily',
        operator: 'in',
        value: ['door', 'casement'],
        message: 'Demo lock and hinge accessories are restricted to hinged families.'
      }
    ]
  })
]

export const createMvpDemoCompatibilityEngine = () =>
  new CompatibilityRulesEngine({
    rules: createMvpDemoCompatibilityRules()
  })

export const createMvpDemoCutRules = () => [
  new CutRule({
    id: 'demo-cut-frame-miter',
    name: 'Demo frame cut rule',
    rolePrefixes: ['frame_'],
    baseDimension: 'role_auto',
    leftDeductionCm: 0,
    rightDeductionCm: 0,
    jointAssumption: 'miter_45_symmetric',
    priority: 10,
    notes: 'Frame cut uses clear opening size in the demo profile.'
  }),
  new CutRule({
    id: 'demo-cut-sash-miter',
    name: 'Demo sash cut rule',
    rolePrefixes: ['sash_'],
    baseDimension: 'role_auto',
    leftDeductionCm: 2.5,
    rightDeductionCm: 2.5,
    jointAssumption: 'miter_45_symmetric',
    priority: 20,
    notes: 'Sash cuts include explicit symmetric deductions in centimeters.'
  })
]

export const createMvpDemoMachiningTemplates = () => [
  new MachiningTemplate({
    id: 'demo-mach-lock-pocket',
    name: 'Demo lock-case pocket',
    operationCode: 'DEMO_LOCK_CASE_POCKET',
    targetType: 'accessory_kind',
    targetValues: ['lock'],
    targetMatchMode: 'exact',
    sectionTypes: ['sash'],
    referencePoint: {
      xAnchor: 'right',
      yAnchor: 'center',
      xOffsetMm: -80,
      yOffsetMm: 0
    },
    quantityModel: {
      mode: 'per_source_quantity',
      multiplier: 1
    },
    holePattern: {
      holesPerOperation: 1,
      spacingMm: 0
    },
    notes: 'Demo machining template for mortise lock case operation.'
  })
]
