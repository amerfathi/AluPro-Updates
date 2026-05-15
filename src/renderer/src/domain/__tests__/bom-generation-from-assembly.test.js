import { describe, expect, it } from 'vitest'
import { generateBOMFromAssemblyTree } from '../bom/generateBOMFromAssemblyTree.js'
import { compileTechnicalSystemWindow } from '../../utils/technicalSystem.js'

const createSingleLeafHingedDoorFixture = () => ({
  id: 'sys-hinged-door-bom',
  name: 'Single Leaf Hinged Door',
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
      id: 1001,
      label: 'Door frame width',
      qty: 2,
      cutType: '45',
      inventoryId: 'alu-frame-door',
      physicalRole: 'frame_w',
      divideBy: 1,
      offsetCm: 0
    },
    {
      id: 1002,
      label: 'Door frame height',
      qty: 2,
      cutType: '45',
      inventoryId: 'alu-frame-door',
      physicalRole: 'frame_h',
      divideBy: 1,
      offsetCm: 0
    },
    {
      id: 1003,
      label: 'Door sash width',
      qty: 2,
      cutType: '45',
      inventoryId: 'alu-sash-door',
      physicalRole: 'sash_w',
      divideBy: 1,
      offsetCm: -1
    }
  ],
  glassFormulas: [
    {
      id: 2001,
      label: 'Door glass',
      qty: 1,
      inventoryId: 'glass-8mm',
      physicalRole: 'glass_sash',
      divideW: 1,
      offsetW: -1,
      divideH: 1,
      offsetH: -1
    }
  ],
  accessories: [
    {
      id: 'acc-hinge-1',
      name: 'Heavy duty hinge set',
      qtyPerWindow: 3,
      inventoryId: 'hinge-heavy',
      calcMode: 'per_opening',
      sectionType: 'sash'
    },
    {
      id: 'acc-lock-1',
      name: 'Mortise lock handle',
      qtyPerWindow: 1,
      inventoryId: 'lock-mortise',
      calcMode: 'per_opening',
      sectionType: 'sash'
    },
    {
      id: 'acc-gasket-1',
      name: 'EPDM gasket roll',
      qtyPerWindow: 5.5,
      inventoryId: 'gasket-epdm',
      calcMode: 'per_perimeter',
      sectionType: 'all'
    },
    {
      id: 'acc-related-1',
      name: 'Door stopper accessory',
      qtyPerWindow: 1,
      inventoryId: 'acc-door-stopper',
      calcMode: 'per_opening',
      sectionType: 'all'
    }
  ],
  workshopOperations: []
})

const createSingleLeafOpeningFixture = () => ({
  id: 'opening-bom-1',
  width: '1.00',
  height: '2.20',
  quantity: '1',
  label: 'Door A',
  sashType: 'casement',
  openingDirection: 'right',
  isComplex: false,
  sections: [{ id: 1, type: 'sash', h: '' }]
})

const createMultiSectionFixture = () => ({
  id: 'sys-multi-sections',
  name: 'Multi section test',
  systemType: 'sliding',
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
      id: 3001,
      label: 'Frame width',
      qty: 2,
      cutType: '45',
      inventoryId: 'alu-frame',
      physicalRole: 'frame_w',
      divideBy: 1,
      offsetCm: 0
    },
    {
      id: 3002,
      label: 'Frame height',
      qty: 2,
      cutType: '45',
      inventoryId: 'alu-frame',
      physicalRole: 'frame_h',
      divideBy: 1,
      offsetCm: 0
    },
    {
      id: 3003,
      label: 'Vertical mullion',
      qty: 1,
      cutType: '90',
      inventoryId: 'alu-mullion',
      physicalRole: 'mullion_h',
      divideBy: 1,
      offsetCm: 0
    }
  ],
  glassFormulas: [],
  accessories: [
    {
      id: 'multi-hinge',
      name: 'Hinge set',
      qtyPerWindow: 1,
      inventoryId: 'hinge-basic',
      calcMode: 'per_opening',
      sectionType: 'sash'
    }
  ],
  workshopOperations: []
})

const createMultiSectionOpening = () => ({
  id: 'opening-multi-1',
  width: '1.50',
  height: '1.80',
  quantity: '1',
  label: 'Window B',
  sashType: 'sliding',
  isComplex: true,
  sections: [
    { id: 1, type: 'sash', h: '' },
    { id: 2, type: 'sash', h: '' },
    { id: 3, type: 'sash', h: '' }
  ]
})

describe('BOM generation from assembly tree', () => {
  it('builds profiles, glass, gaskets, hinges, lock and accessories from the assembly tree', () => {
    const compiled = compileTechnicalSystemWindow({
      system: createSingleLeafHingedDoorFixture(),
      opening: createSingleLeafOpeningFixture()
    })

    expect(compiled.errors).toHaveLength(0)
    expect(compiled.assemblyTree).toBeTruthy()
    expect(compiled.bomItems.length).toBeGreaterThan(0)
    expect(compiled.pieces.length).toBeGreaterThan(0)
    expect(compiled.glass.length).toBeGreaterThan(0)
    expect(compiled.accessories.some((item) => item.accessoryKind === 'gasket')).toBe(true)
    expect(compiled.accessories.some((item) => item.accessoryKind === 'hinge')).toBe(true)
    expect(compiled.accessories.some((item) => item.accessoryKind === 'lock')).toBe(true)
    expect(compiled.accessories.some((item) => item.accessoryKind === 'generic')).toBe(true)

    const derivedAgain = generateBOMFromAssemblyTree({
      assemblyTree: compiled.assemblyTree,
      system: compiled.normalized
    })
    expect(derivedAgain.pieces).toEqual(compiled.pieces)
    expect(derivedAgain.glass).toEqual(compiled.glass)
    expect(derivedAgain.accessories).toEqual(compiled.accessories)
  })

  it('does not duplicate per-opening accessories across multiple sections and applies mullion quantity', () => {
    const compiled = compileTechnicalSystemWindow({
      system: createMultiSectionFixture(),
      opening: createMultiSectionOpening()
    })

    expect(compiled.errors).toHaveLength(0)

    const mullionPiece = compiled.pieces.find((piece) => piece.physicalRole === 'mullion_h')
    expect(mullionPiece).toBeTruthy()
    expect(mullionPiece.quantity).toBe(2)

    const hingeItems = compiled.accessories.filter((item) => item.accessoryKind === 'hinge')
    expect(hingeItems).toHaveLength(1)
    expect(hingeItems[0].quantity).toBe(1)
  })
})
