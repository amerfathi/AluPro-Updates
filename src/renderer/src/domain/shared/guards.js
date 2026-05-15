import { DomainValidationError } from './DomainValidationError.js'

const toNumber = (value) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return Number(value)
  return Number.NaN
}

export const assertNonEmptyString = (value, fieldName) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new DomainValidationError(`${fieldName} must be a non-empty string`, {
      fieldName,
      value
    })
  }
  return value.trim()
}

export const assertPositiveNumber = (value, fieldName) => {
  const parsed = toNumber(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new DomainValidationError(`${fieldName} must be a positive number`, {
      fieldName,
      value
    })
  }
  return parsed
}

export const assertNonNegativeNumber = (value, fieldName, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback
  const parsed = toNumber(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new DomainValidationError(`${fieldName} must be a non-negative number`, {
      fieldName,
      value
    })
  }
  return parsed
}

export const assertOneOf = (value, acceptedValues, fieldName) => {
  if (!acceptedValues.includes(value)) {
    throw new DomainValidationError(`${fieldName} must be one of: ${acceptedValues.join(', ')}`, {
      fieldName,
      value,
      acceptedValues
    })
  }
  return value
}

export const asArray = (value) => (Array.isArray(value) ? value : [])
