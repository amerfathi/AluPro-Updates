import { assertNonEmptyString, assertOneOf } from '../shared/guards.js'

export const profileFamilyIds = Object.freeze([
  'sliding',
  'fixed',
  'casement',
  'door',
  'facade',
  'hybrid',
  'custom'
])

const normalizeFamilyId = (value) => {
  const normalized = assertNonEmptyString(value, 'family.id').toLowerCase()
  return profileFamilyIds.includes(normalized) ? normalized : 'custom'
}

export class ProfileFamily {
  constructor({ id, name, description = '' }) {
    this.id = assertOneOf(normalizeFamilyId(id), profileFamilyIds, 'family.id')
    this.name = assertNonEmptyString(name, 'family.name')
    this.description = typeof description === 'string' ? description.trim() : ''

    Object.freeze(this)
  }

  matches(value) {
    return normalizeFamilyId(value) === this.id
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description
    }
  }

  static from(value) {
    if (value instanceof ProfileFamily) return value
    if (typeof value === 'string') {
      const normalized = normalizeFamilyId(value)
      return new ProfileFamily({
        id: normalized,
        name: normalized
      })
    }
    return new ProfileFamily(value)
  }

  static fromSystemType(systemType) {
    return ProfileFamily.from(systemType || 'custom')
  }
}
