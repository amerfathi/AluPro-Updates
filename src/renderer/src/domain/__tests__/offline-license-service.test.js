import { createSign, generateKeyPairSync } from 'crypto'
import { mkdirSync, mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { LICENSE_TOKEN_PREFIX, canonicalizeLicensePayload, encodeBase64Url } from '../../../../main/license-core'
import { OfflineLicenseService } from '../../../../main/license-service'

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
  licenseId: 'LIC-100',
  hwid: 'PC-ABC123',
  expiryDate: '2030-12-31',
  issuedAt: '2026-05-15T00:00:00.000Z',
  plan: 'pro',
  features: ['bom', 'cut'],
  ...overrides
})

describe('Offline license service', () => {
  it('returns a safe error when license state cannot be persisted', () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    })

    const payload = createPayload()
    const token = buildToken(payload, privateKey)
    const tempDir = mkdtempSync(join(tmpdir(), 'alu-license-state-'))
    const invalidStatePath = join(tempDir, 'license-state.json')
    mkdirSync(invalidStatePath, { recursive: true })

    try {
      const service = new OfflineLicenseService({
        stateFilePath: invalidStatePath,
        publicKeyPem: publicKey,
        resolveHardwareId: () => 'PC-ABC123',
        now: () => new Date('2026-05-15T10:00:00.000Z')
      })

      const result = service.activateToken(token)

      expect(result.ok).toBe(false)
      expect(result.status.reason).toBe('state_persist_failed')
      expect(result.message).toContain('تعذر حفظ التفعيل')
    } finally {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })
})

