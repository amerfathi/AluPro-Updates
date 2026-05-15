import { createVerify } from 'crypto'

export const LICENSE_TOKEN_PREFIX = 'ALU1'

export type LicensePayload = {
  v: number
  licenseId: string
  hwid: string
  expiryDate: string
  issuedAt: string
  plan?: string
  customer?: string
  features?: string[]
}

export type LicenseParseResult =
  | { ok: true; payload: LicensePayload; signature: Buffer }
  | { ok: false; reason: string }

export type LicenseSignatureResult =
  | { ok: true; payload: LicensePayload }
  | { ok: false; reason: string }

export type LicenseRuntimeValidationCode =
  | 'ok'
  | 'expired'
  | 'hwid_mismatch'
  | 'invalid_expiry_date'
  | 'clock_rollback_detected'

export type LicenseRuntimeValidationResult = {
  code: LicenseRuntimeValidationCode
  expiryDate: string
}

export const encodeBase64Url = (value: Buffer | string): string =>
  Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

export const decodeBase64Url = (input: string): Buffer => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const remainder = normalized.length % 4
  const padded = normalized + (remainder === 0 ? '' : '='.repeat(4 - remainder))

  return Buffer.from(padded, 'base64')
}

export const normalizeLicensePayload = (payload: LicensePayload): LicensePayload => ({
  v: Number(payload.v) || 1,
  licenseId: String(payload.licenseId || '').trim(),
  hwid: String(payload.hwid || '').trim().toUpperCase(),
  expiryDate: String(payload.expiryDate || '').trim(),
  issuedAt: String(payload.issuedAt || '').trim(),
  plan: payload.plan ? String(payload.plan).trim() : undefined,
  customer: payload.customer ? String(payload.customer).trim() : undefined,
  features: Array.isArray(payload.features)
    ? payload.features
        .map((feature) => String(feature || '').trim())
        .filter(Boolean)
        .sort()
    : undefined
})

export const canonicalizeLicensePayload = (payload: LicensePayload): string =>
  JSON.stringify(normalizeLicensePayload(payload))

const isValidPayloadShape = (payload: LicensePayload): boolean =>
  Boolean(payload.licenseId && payload.hwid && payload.expiryDate && payload.issuedAt)

export const parseLicenseToken = (rawToken: string): LicenseParseResult => {
  const token = String(rawToken || '').trim()

  if (!token) {
    return { ok: false, reason: 'empty_token' }
  }

  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== LICENSE_TOKEN_PREFIX) {
    return { ok: false, reason: 'invalid_token_format' }
  }

  try {
    const payloadJson = decodeBase64Url(parts[1]).toString('utf8')
    const payload = normalizeLicensePayload(JSON.parse(payloadJson))
    if (!isValidPayloadShape(payload)) {
      return { ok: false, reason: 'invalid_payload' }
    }

    const signature = decodeBase64Url(parts[2])
    if (!signature.length) {
      return { ok: false, reason: 'invalid_signature' }
    }

    return { ok: true, payload, signature }
  } catch {
    return { ok: false, reason: 'invalid_token_payload' }
  }
}

export const verifyLicenseSignature = (
  token: string,
  publicKeyPem: string
): LicenseSignatureResult => {
  const parsed = parseLicenseToken(token)
  if (!parsed.ok) {
    return parsed
  }

  try {
    const verifier = createVerify('RSA-SHA256')
    verifier.update(canonicalizeLicensePayload(parsed.payload))
    verifier.end()

    const valid = verifier.verify(publicKeyPem, parsed.signature)
    if (!valid) {
      return { ok: false, reason: 'signature_verification_failed' }
    }

    return { ok: true, payload: parsed.payload }
  } catch {
    return { ok: false, reason: 'signature_verification_error' }
  }
}

const parseUtcDate = (value: string): Date | null => {
  const maybeDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const normalizedValue = maybeDateOnly ? `${value}T23:59:59.999Z` : value
  const parsedDate = new Date(normalizedValue)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate
}

export const validateLicenseRuntime = ({
  payload,
  currentDeviceId,
  now,
  lastValidatedAt,
  rollbackToleranceMinutes = 5
}: {
  payload: LicensePayload
  currentDeviceId: string
  now: Date
  lastValidatedAt?: string
  rollbackToleranceMinutes?: number
}): LicenseRuntimeValidationResult => {
  const expiryDate = payload.expiryDate
  const expiryAt = parseUtcDate(expiryDate)
  if (!expiryAt) {
    return { code: 'invalid_expiry_date', expiryDate }
  }

  const normalizedDeviceId = String(currentDeviceId || '').trim().toUpperCase()
  if (payload.hwid !== normalizedDeviceId) {
    return { code: 'hwid_mismatch', expiryDate }
  }

  if (lastValidatedAt) {
    const previousDate = parseUtcDate(lastValidatedAt)
    if (previousDate) {
      const toleranceMs = Math.max(0, rollbackToleranceMinutes) * 60_000
      if (now.getTime() + toleranceMs < previousDate.getTime()) {
        return { code: 'clock_rollback_detected', expiryDate }
      }
    }
  }

  if (now.getTime() > expiryAt.getTime()) {
    return { code: 'expired', expiryDate }
  }

  return { code: 'ok', expiryDate }
}
