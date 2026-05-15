import { asArray } from '../shared/guards.js'
import { ProfileGeometry } from '../profile/ProfileGeometry.js'
import { semanticZoneIds } from '../profile/SemanticZone.js'

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeRoleToZone = (role) => {
  const token = String(role || '')
    .trim()
    .toLowerCase()
  if (!token) return null

  if (semanticZoneIds.includes(token)) return token
  if (token.startsWith('frame_')) return token.endsWith('_h') ? 'frame_h' : 'frame_w'
  if (token.startsWith('mullion_')) return token.endsWith('_h') ? 'mullion_h' : 'mullion_w'
  if (token.startsWith('sash_')) return token.endsWith('_h') ? 'sash_h' : 'sash_w'
  if (token.startsWith('bead_fixed_')) return token.endsWith('_h') ? 'bead_fixed_h' : 'bead_fixed_w'
  if (token.startsWith('bead_sash_')) return token.endsWith('_h') ? 'bead_sash_h' : 'bead_sash_w'
  if (token.includes('glass')) return token.includes('sash') ? 'glass_sash' : 'glass_fixed'
  return null
}

const inferFallbackZones = (systemType) => {
  const token = String(systemType || '')
    .trim()
    .toLowerCase()

  if (token === 'fixed') {
    return ['frame_w', 'frame_h', 'glass_fixed']
  }

  return ['frame_w', 'frame_h', 'sash_w', 'sash_h', 'glass_sash']
}

const collectProfileZones = (profile = {}) => {
  const zones = new Set()

  asArray(profile.structuredFormulas).forEach((formula) => {
    const zoneId = normalizeRoleToZone(formula?.physicalRole)
    if (zoneId) zones.add(zoneId)
  })

  asArray(profile.glassFormulas).forEach((formula) => {
    const zoneId = normalizeRoleToZone(formula?.physicalRole)
    if (zoneId) zones.add(zoneId)
  })

  if (zones.size === 0) {
    inferFallbackZones(profile.systemType).forEach((zoneId) => zones.add(zoneId))
  }

  return Array.from(zones)
}

export const createProfileGeometryFromLegacyProfile = (profile = {}) => {
  const profileId = String(profile?.id || '').trim()
  if (!profileId) return null

  return new ProfileGeometry({
    id: `geometry-${profileId}`,
    zones: collectProfileZones(profile),
    depthMm: toNumber(profile?.physics?.frameDedW, 0) * 10,
    wallThicknessMm: toNumber(profile?.mullionThicknessCm, 0) * 10,
    metadata: {
      source: 'legacy-profile-preview-adapter',
      profileId,
      profileName: String(profile?.name || '')
    }
  })
}

export const createProfileGeometryCatalog = (profiles = []) => {
  const catalog = new Map()

  asArray(profiles).forEach((profile) => {
    const profileId = String(profile?.id || '').trim()
    if (!profileId || catalog.has(profileId)) return

    const geometry = createProfileGeometryFromLegacyProfile(profile)
    if (!geometry) return
    catalog.set(profileId, geometry)
  })

  return catalog
}
