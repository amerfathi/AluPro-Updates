import { createSign, generateKeyPairSync } from 'crypto'
import { describe, expect, it } from 'vitest'
import {
  LICENSE_TOKEN_PREFIX,
  canonicalizeLicensePayload,
  encodeBase64Url,
  validateLicenseRuntime,
  verifyLicenseSignature
} from '../../../../main/license-core'

const buildToken = (payload, privateKeyPem) => {
  const canonicalPayload = canonicalizeLicensePayload(payload)
  const signer = createSign('RSA-SHA256')
  signer.update(canonicalPayload)
  signer.end()

  const signature = signer.sign(privateKeyPem)
  return `${LICENSE_TOKEN_PREFIX}.${encodeBase64Url(canonicalPayload)}.${encodeBase64Url(signature)}`
}

const createPayload = (overrides = {}) => ({
  v: 1,
  licenseId: 'LIC-001',
  hwid: 'PC-ABC123',
  expiryDate: '2030-12-31',
  issuedAt: '2026-05-15T00:00:00.000Z',
  plan: 'pro',
  features: ['cut', 'bom'],
  ...overrides
})

describe('Offline license core', () => {
  it('verifies valid signed license token', () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    })

    const payload = createPayload()
    const token = buildToken(payload, privateKey)
    const result = verifyLicenseSignature(token, publicKey)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload.hwid).toBe('PC-ABC123')
      expect(result.payload.expiryDate).toBe('2030-12-31')
    }
  })

  it('rejects tampered payload with same signature', () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    })

    const payload = createPayload()
    const token = buildToken(payload, privateKey)
    const [prefix, payloadPart, signaturePart] = token.split('.')
    const tamperedPayloadPart = encodeBase64Url(
      canonicalizeLicensePayload({ ...payload, hwid: 'PC-HACKED' })
    )
    const tamperedToken = `${prefix}.${tamperedPayloadPart}.${signaturePart}`

    const result = verifyLicenseSignature(tamperedToken, publicKey)
    expect(result.ok).toBe(false)
  })

  it('fails runtime validation on hwid mismatch', () => {
    const payload = createPayload({ hwid: 'PC-ORIGINAL' })
    const validation = validateLicenseRuntime({
      payload,
      currentDeviceId: 'PC-OTHER',
      now: new Date('2026-05-15T10:00:00.000Z')
    })

    expect(validation.code).toBe('hwid_mismatch')
  })

  it('fails runtime validation when expired', () => {
    const payload = createPayload({ expiryDate: '2025-01-01' })
    const validation = validateLicenseRuntime({
      payload,
      currentDeviceId: 'PC-ABC123',
      now: new Date('2026-05-15T10:00:00.000Z')
    })

    expect(validation.code).toBe('expired')
  })

  it('detects suspicious clock rollback', () => {
    const payload = createPayload()
    const validation = validateLicenseRuntime({
      payload,
      currentDeviceId: 'PC-ABC123',
      now: new Date('2026-05-15T08:00:00.000Z'),
      lastValidatedAt: '2026-05-15T12:00:00.000Z',
      rollbackToleranceMinutes: 2
    })

    expect(validation.code).toBe('clock_rollback_detected')
  })
})
