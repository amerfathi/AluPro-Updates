import { describe, expect, it } from 'vitest'
import { compileAssemblyGrid } from '../../utils/assemblyLayout.js'

const createFrameProfileFixture = () => ({
  id: 'frame-profile-1',
  name: 'Frame Profile',
  systemType: 'fixed',
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
      id: 'f-1',
      label: 'Frame width',
      qty: 2,
      cutType: '45',
      inventoryId: 'alu-frame',
      physicalRole: 'frame_w',
      divideBy: 1,
      offsetCm: 0
    },
    {
      id: 'f-2',
      label: 'Frame height',
      qty: 2,
      cutType: '45',
      inventoryId: 'alu-frame',
      physicalRole: 'frame_h',
      divideBy: 1,
      offsetCm: 0
    }
  ],
  glassFormulas: [],
  accessories: [],
  workshopOperations: []
})

const createSashProfileFixture = () => ({
  id: 'sash-profile-1',
  name: 'Sash Profile',
  systemType: 'casement',
  miterWasteCm: 6.5,
  mullionThicknessCm: 3.5,
  physics: {
    frameDedW: 5,
    frameDedH: 5,
    sashDedW: 10,
    sashDedH: 10
  },
  structuredFormulas: [
    {
      id: 's-1',
      label: 'Sash width',
      qty: 2,
      cutType: '45',
      inventoryId: 'alu-sash',
      physicalRole: 'sash_w',
      divideBy: 1,
      offsetCm: 0
    },
    {
      id: 's-2',
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
  accessories: [],
  workshopOperations: []
})

describe('Domain-driven preview model for assembly rendering', () => {
  it('builds a preview model from assembly tree and profile geometry, then adapts to legacy visual model', () => {
    const frameProfile = createFrameProfileFixture()
    const sashProfile = createSashProfileFixture()

    const result = compileAssemblyGrid({
      width: '2.40',
      height: '2.00',
      quantity: '1',
      label: 'Facade A',
      frameProfile,
      profiles: [frameProfile, sashProfile],
      rows: [{ id: 'row-1', size: '1.00' }],
      columns: [
        { id: 'col-1', size: '1.20' },
        { id: 'col-2', size: '1.20' }
      ],
      modules: [
        {
          id: 'module-left',
          label: 'Left sash',
          type: 'sash',
          profileId: sashProfile.id,
          row: 0,
          col: 0,
          rowSpan: 1,
          colSpan: 1
        },
        {
          id: 'module-right',
          label: 'Right fixed',
          type: 'fixed',
          profileId: sashProfile.id,
          row: 0,
          col: 1,
          rowSpan: 1,
          colSpan: 1
        }
      ]
    })

    expect(result.errors).toHaveLength(0)
    expect(result.previewAssemblyTree).toBeTruthy()
    expect(result.previewModel).toBeTruthy()
    expect(result.previewModel.source).toBe('domain-assembly-tree')
    expect(result.previewModel.modules).toHaveLength(result.modulesPreview.length)

    const firstModule = result.previewModel.modules[0]
    expect(firstModule.profile).toBeTruthy()
    expect(firstModule.profile.geometry).toBeTruthy()
    expect(firstModule.profile.geometry.zones.length).toBeGreaterThan(0)

    expect(result.visualModel).toBeTruthy()
    expect(result.visualModel.wallWidth).toBeCloseTo(result.previewModel.canvas.widthM, 6)
    expect(result.visualModel.wallHeight).toBeCloseTo(result.previewModel.canvas.heightM, 6)

    expect(result.previewAssemblyTree.metadata.configurationRules.rows.length).toBe(1)
    expect(result.previewAssemblyTree.metadata.configurationRules.columns.length).toBe(2)
  })
})
