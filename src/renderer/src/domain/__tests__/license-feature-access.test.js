import { describe, expect, it } from 'vitest'
import { buildLicenseFeatureAccess } from '../../config/licenseFeatures.js'

describe('license feature access policy', () => {
  it('keeps full access when feature list is empty (legacy behavior)', () => {
    const access = buildLicenseFeatureAccess([])
    expect(access.unrestricted).toBe(true)
    expect(access.has('dashboard')).toBe(true)
    expect(access.has('inventory')).toBe(true)
  })

  it('keeps full access for old manufacturing-only feature lists', () => {
    const access = buildLicenseFeatureAccess(['bom', 'cut', 'machining'])
    expect(access.unrestricted).toBe(true)
    expect(access.has('contracts')).toBe(true)
    expect(access.has('admin_settings')).toBe(true)
  })

  it('restricts access when explicit UI features are provided', () => {
    const access = buildLicenseFeatureAccess(['dashboard', 'production'])
    expect(access.unrestricted).toBe(false)
    expect(access.has('dashboard')).toBe(true)
    expect(access.has('production')).toBe(true)
    expect(access.has('contracts')).toBe(false)
    expect(access.has('inventory')).toBe(false)
  })

  it('supports wildcard access', () => {
    const access = buildLicenseFeatureAccess(['all'])
    expect(access.has('dashboard')).toBe(true)
    expect(access.has('technical_catalog')).toBe(true)
  })
})
