import { Accessory } from '../materials/Accessory.js'
import { InterfaceDefinition } from '../profile/InterfaceDefinition.js'
import { ProfileFamily } from '../profile/ProfileFamily.js'
import { ProfileGeometry } from '../profile/ProfileGeometry.js'
import { ProfileVariant } from '../profile/ProfileVariant.js'
import { CompatibilityRule } from '../rules/CompatibilityRule.js'
import { System } from '../system/System.js'
import { asArray } from '../shared/guards.js'

const toSafeString = (value, fallback = '') =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback

const buildZonesFromLegacyProfile = (legacyProfile = {}) => {
  const aluminumRoles = asArray(legacyProfile.structuredFormulas).map((item) => item?.physicalRole)
  const glassRoles = asArray(legacyProfile.glassFormulas).map((item) => item?.physicalRole)
  const zones = [...aluminumRoles, ...glassRoles].filter(Boolean)

  if (zones.length > 0) return Array.from(new Set(zones))

  // Assumption: if formulas are missing, seed minimal zones to keep backward compatibility.
  return legacyProfile.systemType === 'fixed'
    ? ['frame_w', 'frame_h', 'glass_fixed']
    : ['frame_w', 'frame_h', 'sash_w', 'sash_h', 'glass_sash']
}

const buildDefaultInterfaces = (zones, familyId, geometryId) => {
  const has = (zoneId) => zones.includes(zoneId)
  const interfaces = []

  if (has('frame_w') && has('sash_w')) {
    interfaces.push(
      new InterfaceDefinition({
        id: `${geometryId}-if-frame-sash`,
        sourceZone: 'frame_w',
        targetZone: 'sash_w',
        joinType: familyId === 'sliding' ? 'sliding-track' : 'hinge',
        description: 'Default frame-to-sash interface'
      })
    )
  }

  if (has('bead_fixed_w') && has('glass_fixed')) {
    interfaces.push(
      new InterfaceDefinition({
        id: `${geometryId}-if-bead-fixed-glass`,
        sourceZone: 'bead_fixed_w',
        targetZone: 'glass_fixed',
        joinType: 'gasket',
        description: 'Default fixed glazing interface'
      })
    )
  }

  if (has('bead_sash_w') && has('glass_sash')) {
    interfaces.push(
      new InterfaceDefinition({
        id: `${geometryId}-if-bead-sash-glass`,
        sourceZone: 'bead_sash_w',
        targetZone: 'glass_sash',
        joinType: 'gasket',
        description: 'Default sash glazing interface'
      })
    )
  }

  return interfaces
}

const mapLegacyAccessories = (legacyProfile, variantId) =>
  asArray(legacyProfile.accessories).map(
    (entry, index) =>
      new Accessory({
        id: entry?.id ? String(entry.id) : `${variantId}-acc-${index + 1}`,
        name: toSafeString(entry?.name, 'Accessory'),
        inventoryId: toSafeString(entry?.inventoryId),
        qtyPerWindow: entry?.qtyPerWindow ?? 1,
        calcMode: entry?.calcMode || 'per_opening',
        sectionType: entry?.sectionType || 'all',
        compatibleZones: entry?.compatibleZones || []
      })
  )

export const createProfileVariantFromLegacy = (legacyProfile = {}) => {
  const variantId = legacyProfile?.id ? String(legacyProfile.id) : `legacy-${Date.now()}`
  const family = ProfileFamily.fromSystemType(legacyProfile.systemType || 'custom')
  const zones = buildZonesFromLegacyProfile(legacyProfile)
  const geometryId = `${variantId}-geometry`

  const geometry = new ProfileGeometry({
    id: geometryId,
    zones,
    interfaces: buildDefaultInterfaces(zones, family.id, geometryId),
    depthMm: Number(legacyProfile?.mullionThicknessCm || 0) * 10,
    metadata: {
      source: 'legacy-profile',
      legacySystemType: legacyProfile.systemType || 'unknown'
    }
  })

  return new ProfileVariant({
    id: variantId,
    name: toSafeString(legacyProfile.name, `Variant ${variantId}`),
    family,
    geometry,
    physics: legacyProfile.physics || {},
    accessories: mapLegacyAccessories(legacyProfile, variantId),
    structuredFormulas: legacyProfile.structuredFormulas || [],
    glassFormulas: legacyProfile.glassFormulas || [],
    workshopOperations: legacyProfile.workshopOperations || [],
    metadata: {
      color: legacyProfile.color || '',
      miterWasteCm: Number(legacyProfile.miterWasteCm) || 0
    },
    legacyProfile
  })
}

export const createDefaultCompatibilityRulesForFamily = (familyId) => {
  const rules = [
    new CompatibilityRule({
      id: `${familyId}-deny-fixed-with-sash-zone`,
      name: 'Fixed family must not bind sash-only zone',
      scope: 'profile-accessory',
      effect: 'deny',
      priority: 1,
      conditions: {
        profileFamily: 'fixed',
        zoneId: ['sash_w', 'sash_h', 'glass_sash']
      },
      message: 'Fixed systems do not support sash-specific semantic zones'
    })
  ]

  if (familyId === 'sliding') {
    rules.push(
      new CompatibilityRule({
        id: `${familyId}-deny-sliding-fixed-only-section`,
        name: 'Sliding profile cannot force fixed-only accessory on sash usage',
        scope: 'profile-accessory',
        effect: 'deny',
        priority: 2,
        conditions: {
          profileFamily: 'sliding',
          sectionType: 'fixed'
        },
        message: 'This sliding setup requires sash or all-section accessories'
      })
    )
  }

  return rules
}

export const createSystemsFromLegacyProfiles = (legacyProfiles = []) => {
  const groupedByFamily = new Map()

  asArray(legacyProfiles).forEach((legacyProfile) => {
    const variant = createProfileVariantFromLegacy(legacyProfile)
    const familyId = variant.family.id
    if (!groupedByFamily.has(familyId)) groupedByFamily.set(familyId, [])
    groupedByFamily.get(familyId).push(variant)
  })

  return Array.from(groupedByFamily.entries()).map(([familyId, variants]) => {
    const family = ProfileFamily.from(familyId)
    return new System({
      id: `system-${familyId}`,
      name: `${family.name} system`,
      family,
      variants,
      compatibilityRules: createDefaultCompatibilityRulesForFamily(familyId),
      metadata: {
        source: 'legacy-profiles-adapter'
      }
    })
  })
}
