import { describe, expect, it } from 'vitest'
import { compileTechnicalSystemWindow } from '../../utils/technicalSystem.js'
import { generateBOMFromAssemblyTree } from '../bom/generateBOMFromAssemblyTree.js'
import { generateMachiningOperations } from '../machining/generateMachiningOperations.js'
import { buildCompatibilityValidationContext } from '../rules/compatibility/contextBuilders.js'
import { ProfileCutRulesEngine } from '../rules/cutting/ProfileCutRulesEngine.js'
import {
  createMvpDemoCompatibilityEngine,
  createMvpDemoCutRules,
  createMvpDemoDomainSystem,
  createMvpDemoGlazingRule,
  createMvpDemoInventory,
  createMvpDemoLegacySystem,
  createMvpDemoMachiningTemplates,
  createMvpDemoOpening,
  isMvpDemoGlassThicknessAllowed,
  mvpDemoDataNotice
} from '../seeds/mvpHingedDoorDemoSeed.js'

const flattenTree = (node, collector = []) => {
  if (!node) return collector
  collector.push(node)
  ;(node.children || []).forEach((child) => flattenTree(child, collector))
  return collector
}

describe('MVP demo seed data', () => {
  it('contains realistic domain demo definitions with explicit assumptions', () => {
    const domainSystem = createMvpDemoDomainSystem()
    expect(domainSystem.id).toBe('demo-mvp-hinged-door-v1')
    expect(domainSystem.family.id).toBe('door')
    expect(domainSystem.metadata.notes).toContain('Demo data only')

    const variant = domainSystem.variants[0]
    expect(variant.family.id).toBe('casement')

    const geometryZoneIds = variant.geometry.zones.map((zone) => zone.id)
    expect(geometryZoneIds).toEqual(
      expect.arrayContaining([
        'frame_w',
        'frame_h',
        'sash_w',
        'sash_h',
        'bead_sash_w',
        'bead_sash_h',
        'glass_sash'
      ])
    )

    expect(variant.geometry.interfaces.length).toBeGreaterThan(0)
    expect(variant.accessories.some((item) => item.name.toLowerCase().includes('lock'))).toBe(true)
    expect(variant.accessories.some((item) => item.name.toLowerCase().includes('hinge'))).toBe(true)
    expect(mvpDemoDataNotice).toContain('Demo data only')
  })

  it('proves one end-to-end hinged door scenario from the demo seed', () => {
    const inventory = createMvpDemoInventory()
    const system = createMvpDemoLegacySystem()
    const opening = createMvpDemoOpening()

    const glazingRule = createMvpDemoGlazingRule()
    expect(glazingRule.glassRole).toBe('glass_sash')
    expect(isMvpDemoGlassThicknessAllowed({ thicknessMm: 8, glazingRule })).toBe(true)
    expect(isMvpDemoGlassThicknessAllowed({ thicknessMm: 30, glazingRule })).toBe(false)

    const compatibilityEngine = createMvpDemoCompatibilityEngine()
    const compatibilityContext = buildCompatibilityValidationContext({
      system,
      inventory,
      opening
    })
    const compatibility = compatibilityEngine.validate(compatibilityContext)
    expect(compatibility.errors).toHaveLength(0)

    const compiled = compileTechnicalSystemWindow({ system, opening })
    expect(compiled.errors).toHaveLength(0)
    expect(compiled.assemblyTree).toBeTruthy()

    const nodes = flattenTree(compiled.assemblyTree.root)
    expect(nodes.some((node) => node.partType === 'frame')).toBe(true)
    expect(nodes.some((node) => node.partType === 'sash')).toBe(true)
    expect(nodes.some((node) => node.partType === 'glass')).toBe(true)
    expect(nodes.some((node) => node.partType === 'hinge')).toBe(true)
    expect(nodes.some((node) => node.partType === 'lock')).toBe(true)
    expect(nodes.some((node) => node.partType === 'gasket')).toBe(true)

    const bom = generateBOMFromAssemblyTree({
      assemblyTree: compiled.assemblyTree,
      system: compiled.normalized
    })
    const bomKinds = new Set(bom.items.map((item) => item.kind))
    expect(bomKinds.has('profile')).toBe(true)
    expect(bomKinds.has('glass')).toBe(true)
    expect(bomKinds.has('hinge')).toBe(true)
    expect(bomKinds.has('lock')).toBe(true)
    expect(bomKinds.has('gasket')).toBe(true)

    const cutRulesEngine = new ProfileCutRulesEngine(createMvpDemoCutRules())
    const frameFormula = system.structuredFormulas.find((formula) => formula.physicalRole === 'frame_w')
    const sashFormula = system.structuredFormulas.find((formula) => formula.physicalRole === 'sash_w')
    expect(frameFormula).toBeTruthy()
    expect(sashFormula).toBeTruthy()

    const frameCut = cutRulesEngine.calculateProfileCut({
      physicalRole: 'frame_w',
      formula: frameFormula,
      elementWidthM: 1,
      elementHeightM: 2.2,
      sectionWidthM: 1,
      sectionHeightM: 2.2
    })
    const sashCut = cutRulesEngine.calculateProfileCut({
      physicalRole: 'sash_w',
      formula: sashFormula,
      elementWidthM: 1,
      elementHeightM: 2.2,
      sectionWidthM: 1,
      sectionHeightM: 2.2
    })

    expect(frameCut?.ruleId).toBe('demo-cut-frame-miter')
    expect(frameCut?.finalLengthM).toBeCloseTo(1, 6)
    expect(sashCut?.ruleId).toBe('demo-cut-sash-miter')
    expect(sashCut?.finalLengthM).toBeCloseTo(0.94, 6)

    const machiningOperations = generateMachiningOperations({
      system: compiled.normalized,
      bom,
      assemblyTree: compiled.assemblyTree,
      templates: createMvpDemoMachiningTemplates()
    })

    expect(machiningOperations.length).toBeGreaterThan(0)
    const lockPocket = machiningOperations.find(
      (operation) => operation.machining.operationCode === 'DEMO_LOCK_CASE_POCKET'
    )
    expect(lockPocket).toBeTruthy()
    expect(lockPocket?.quantity).toBe(1)
  })
})
