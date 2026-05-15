import { describe, expect, it } from 'vitest'
import { createDefaultProfiles } from '../../data/defaults.js'
import {
  Accessory,
  CompatibilityRule,
  DomainValidationError,
  ProfileFamily,
  ProfileGeometry,
  ProfileVariant,
  SemanticZone,
  System,
  createProfileVariantFromLegacy,
  createSystemsFromLegacyProfiles
} from '../index.js'

const createMinimalVariant = (id = 'variant-1', family = 'sliding') =>
  new ProfileVariant({
    id,
    name: 'Test Variant',
    family: ProfileFamily.fromSystemType(family),
    geometry: new ProfileGeometry({
      id: `${id}-geo`,
      zones: ['frame_w', 'frame_h', 'sash_w', 'sash_h', 'glass_sash']
    }),
    accessories: [
      new Accessory({
        id: 'acc-lock',
        name: 'Lock',
        inventoryId: 'item-lock',
        qtyPerWindow: 1,
        sectionType: 'sash',
        compatibleZones: ['sash_w']
      })
    ]
  })

describe('SemanticZone', () => {
  it('rejects unknown zone id', () => {
    expect(() => new SemanticZone('unknown_zone')).toThrow(DomainValidationError)
  })
})

describe('ProfileGeometry', () => {
  it('rejects rendering fields to keep geometry independent from preview concerns', () => {
    expect(
      () =>
        new ProfileGeometry({
          id: 'geo-1',
          zones: ['frame_w'],
          previewAsset: '/assets/frame.png'
        })
    ).toThrow(DomainValidationError)
  })
})

describe('Accessory', () => {
  it('enforces positive qtyPerWindow', () => {
    expect(
      () =>
        new Accessory({
          id: 'acc-1',
          name: 'Test Accessory',
          inventoryId: 'item-1',
          qtyPerWindow: 0
        })
    ).toThrow(DomainValidationError)
  })
})

describe('CompatibilityRule', () => {
  it('evaluates explicit deny rule when context matches', () => {
    const rule = new CompatibilityRule({
      id: 'deny-fixed-sash',
      name: 'Deny sash zone in fixed family',
      effect: 'deny',
      conditions: {
        profileFamily: 'fixed',
        zoneId: ['sash_w', 'sash_h']
      }
    })

    const result = rule.evaluate({
      profileFamily: 'fixed',
      zoneId: 'sash_w'
    })

    expect(result.matched).toBe(true)
    expect(result.allowed).toBe(false)
  })
})

describe('Legacy adapter', () => {
  it('creates a ProfileVariant from existing legacy profile safely', () => {
    const legacy = createDefaultProfiles()[0]
    const variant = createProfileVariantFromLegacy(legacy)

    expect(variant).toBeInstanceOf(ProfileVariant)
    expect(variant.geometry).toBeInstanceOf(ProfileGeometry)
    expect(variant.geometry.hasZone('frame_w')).toBe(true)
    expect(variant.structuredFormulas.length).toBeGreaterThan(0)
  })
})

describe('System compatibility evaluation', () => {
  it('prioritizes explicit compatibility rules over implicit accessory support', () => {
    const variant = createMinimalVariant('variant-rule-check', 'sliding')
    const system = new System({
      id: 'system-rule-check',
      name: 'Rule Check System',
      family: variant.family,
      variants: [variant],
      compatibilityRules: [
        new CompatibilityRule({
          id: 'deny-lock-accessory',
          name: 'Deny this accessory explicitly',
          effect: 'deny',
          priority: 1,
          conditions: {
            variantId: variant.id,
            accessoryId: 'acc-lock'
          }
        })
      ]
    })

    const result = system.evaluateAccessoryCompatibility({
      variantId: variant.id,
      accessory: variant.accessories[0],
      sectionType: 'sash',
      zoneId: 'sash_w'
    })

    expect(result.allowed).toBe(false)
    expect(result.matchedRule).toBe('deny-lock-accessory')
  })

  it('applies default fixed-family rule through legacy systems adapter', () => {
    const template = createDefaultProfiles()[0]
    const fixedLegacy = {
      ...template,
      id: 'fixed-legacy-1',
      name: 'Fixed Legacy',
      systemType: 'fixed',
      structuredFormulas: template.structuredFormulas
        .filter((item) => ['frame_w', 'frame_h'].includes(item.physicalRole))
        .map((item) => ({ ...item })),
      glassFormulas: template.glassFormulas.map((item) => ({
        ...item,
        physicalRole: 'glass_fixed'
      })),
      accessories: [
        {
          id: 'fixed-acc-1',
          name: 'Fixed Accessory',
          inventoryId: 'item_201',
          qtyPerWindow: 1,
          sectionType: 'sash'
        }
      ]
    }

    const systems = createSystemsFromLegacyProfiles([fixedLegacy])
    const fixedSystem = systems.find((entry) => entry.family.id === 'fixed')
    const variant = fixedSystem.variants[0]

    const result = fixedSystem.evaluateAccessoryCompatibility({
      variantId: variant.id,
      accessory: variant.accessories[0],
      sectionType: 'sash',
      zoneId: 'sash_w'
    })

    expect(result.allowed).toBe(false)
    expect(result.matchedRule).toBe('fixed-deny-fixed-with-sash-zone')
  })
})
