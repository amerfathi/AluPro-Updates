import { describe, expect, it } from 'vitest'
import { generateMachiningOperations } from '../machining/generateMachiningOperations.js'
import { compileTechnicalSystemWindow } from '../../utils/technicalSystem.js'

const createMachiningFixtureSystem = () => ({
  id: 'sys-machining-1',
  name: 'Machining MVP System',
  systemType: 'casement',
  miterWasteCm: 6.5,
  mullionThicknessCm: 4,
  physics: {
    frameDedW: 5,
    frameDedH: 5,
    sashDedW: 10,
    sashDedH: 10
  },
  structuredFormulas: [
    {
      id: 4101,
      label: 'Frame width',
      qty: 2,
      cutType: '45',
      inventoryId: 'alu-frame',
      physicalRole: 'frame_w',
      divideBy: 1,
      offsetCm: 0
    },
    {
      id: 4102,
      label: 'Frame height',
      qty: 2,
      cutType: '45',
      inventoryId: 'alu-frame',
      physicalRole: 'frame_h',
      divideBy: 1,
      offsetCm: 0
    },
    {
      id: 4103,
      label: 'Sash width',
      qty: 2,
      cutType: '45',
      inventoryId: 'alu-sash',
      physicalRole: 'sash_w',
      divideBy: 1,
      offsetCm: 0
    },
    {
      id: 4104,
      label: 'Sash height',
      qty: 2,
      cutType: '45',
      inventoryId: 'alu-sash',
      physicalRole: 'sash_h',
      divideBy: 1,
      offsetCm: 0
    }
  ],
  glassFormulas: [],
  accessories: [
    {
      id: 'mvp-hinge',
      name: 'Hinge set',
      qtyPerWindow: 3,
      inventoryId: 'hinge-heavy',
      calcMode: 'per_opening',
      sectionType: 'sash'
    },
    {
      id: 'mvp-lock',
      name: 'Mortise lock',
      qtyPerWindow: 1,
      inventoryId: 'lock-main',
      calcMode: 'per_opening',
      sectionType: 'sash'
    }
  ],
  workshopOperations: [
    {
      id: 'op-legacy-1',
      name: 'Legacy assembly',
      category: 'assembly',
      qtyFactor: 1,
      calcMode: 'per_opening',
      sectionType: 'all',
      unitLabel: 'op',
      costPerUnit: 10,
      notes: ''
    }
  ]
})

const createMachiningFixtureOpening = () => ({
  id: 'open-mach-1',
  width: '1.00',
  height: '2.20',
  quantity: '1',
  label: 'Door M',
  sashType: 'casement',
  openingDirection: 'right',
  isComplex: false,
  sections: [{ id: 1, type: 'sash', h: '' }]
})

describe('Machining templates (MVP)', () => {
  it('generates operations from accessory/profile sources with reference-point formulas', () => {
    const compiled = compileTechnicalSystemWindow({
      system: createMachiningFixtureSystem(),
      opening: createMachiningFixtureOpening()
    })

    const machiningOperations = generateMachiningOperations({
      system: compiled.normalized,
      bom: {
        pieces: compiled.pieces,
        accessories: compiled.accessories
      },
      assemblyTree: compiled.assemblyTree
    })

    expect(machiningOperations.length).toBeGreaterThan(0)

    const hingePattern = machiningOperations.find(
      (operation) => operation.machining.operationCode === 'HINGE_HOLE_PATTERN'
    )
    expect(hingePattern).toBeTruthy()
    expect(hingePattern.quantity).toBe(3)
    expect(hingePattern.machining.referencePointMm.x).toBeCloseTo(35, 6)
    expect(hingePattern.machining.referencePointMm.y).toBeCloseTo(330, 6)
    expect(hingePattern.machining.holePattern.holesPerOperation).toBe(4)

    const lockCase = machiningOperations.find(
      (operation) => operation.machining.operationCode === 'LOCK_CASE_POCKET'
    )
    expect(lockCase).toBeTruthy()
    expect(lockCase.machining.referencePointMm.x).toBeCloseTo(920, 6)
    expect(lockCase.machining.referencePointMm.y).toBeCloseTo(1100, 6)

    const handleSpindle = machiningOperations.find(
      (operation) => operation.machining.operationCode === 'HANDLE_SPINDLE_HOLES'
    )
    expect(handleSpindle).toBeTruthy()
    expect(handleSpindle.machining.referencePointMm.x).toBeCloseTo(945, 6)
    expect(handleSpindle.machining.referencePointMm.y).toBeCloseTo(1100, 6)

    const profileDriven = machiningOperations.filter(
      (operation) => operation.machining.operationCode === 'SASH_DRAIN_SLOTS'
    )
    expect(profileDriven.length).toBeGreaterThan(0)
    expect(profileDriven.some((operation) => operation.machining.sourceRole.startsWith('sash_'))).toBe(
      true
    )
  })

  it('integrates machining operations into compileTechnicalSystemWindow output without replacing legacy workshop operations', () => {
    const compiled = compileTechnicalSystemWindow({
      system: createMachiningFixtureSystem(),
      opening: createMachiningFixtureOpening()
    })

    expect(compiled.errors).toHaveLength(0)
    expect(compiled.machiningOperations.length).toBeGreaterThan(0)

    const machiningInOperations = compiled.operations.filter(
      (operation) => operation.category === 'machining'
    )
    expect(machiningInOperations.length).toBe(compiled.machiningOperations.length)

    const legacyAssemblyOps = compiled.operations.filter(
      (operation) => operation.category === 'assembly'
    )
    expect(legacyAssemblyOps.length).toBeGreaterThan(0)
  })
})
