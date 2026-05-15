import { describe, expect, it } from 'vitest'
import {
  buildTechnicalSystemAssemblyTree,
  compileTechnicalSystemWindow
} from '../../utils/technicalSystem.js'

const flattenTree = (node, collector = []) => {
  if (!node) return collector
  collector.push(node)
  ;(node.children || []).forEach((child) => flattenTree(child, collector))
  return collector
}

const createSingleLeafHingedDoorFixture = () => ({
  id: 'sys-hinged-door-1',
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
    },
    {
      id: 1004,
      label: 'Door sash height',
      qty: 2,
      cutType: '45',
      inventoryId: 'alu-sash-door',
      physicalRole: 'sash_h',
      divideBy: 1,
      offsetCm: -1
    },
    {
      id: 1005,
      label: 'Bead',
      qty: 4,
      cutType: '45',
      inventoryId: 'alu-bead-door',
      physicalRole: 'bead_sash_w',
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
  id: 'opening-1',
  width: '1.00',
  height: '2.20',
  quantity: '1',
  label: 'Door A',
  sashType: 'casement',
  openingDirection: 'right',
  isComplex: false,
  sections: [{ id: 1, type: 'sash', h: '' }]
})

describe('Assembly tree generator (MVP)', () => {
  it('generates a domain assembly tree for a realistic single-leaf hinged door', () => {
    const system = createSingleLeafHingedDoorFixture()
    const opening = createSingleLeafOpeningFixture()

    const compiled = compileTechnicalSystemWindow({ system, opening })
    expect(compiled.errors).toHaveLength(0)
    expect(compiled.assemblyTree).toBeTruthy()

    const nodes = flattenTree(compiled.assemblyTree.root)
    expect(nodes.some((node) => node.partType === 'frame')).toBe(true)
    expect(nodes.filter((node) => node.partType === 'sash')).toHaveLength(1)
    expect(nodes.some((node) => node.partType === 'glass')).toBe(true)
    expect(nodes.some((node) => node.partType === 'gasket')).toBe(true)
    expect(nodes.some((node) => node.partType === 'hinge')).toBe(true)
    expect(nodes.some((node) => node.partType === 'lock')).toBe(true)
    expect(nodes.some((node) => node.partType === 'accessory')).toBe(true)
  })

  it('can generate assembly tree directly through the technical-system adapter helper', () => {
    const system = createSingleLeafHingedDoorFixture()
    const opening = createSingleLeafOpeningFixture()

    const assemblyTree = buildTechnicalSystemAssemblyTree({ system, opening })
    expect(assemblyTree).toBeTruthy()
    expect(assemblyTree.configuredElement.sashType).toBe('casement')
    expect(assemblyTree.configuredElement.sections).toHaveLength(1)
  })
})
