import { createSign } from 'crypto'

export const TOKEN_PREFIX = 'ALU1'

export const encodeBase64Url = (value) =>
  Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

export const normalizePayload = (payload) => ({
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

export const canonicalizePayload = (payload) => JSON.stringify(normalizePayload(payload))

export const generateSignedToken = ({ payload, privateKeyPem }) => {
  const normalizedPayload = normalizePayload(payload)
  const canonicalPayload = canonicalizePayload(normalizedPayload)

  const signer = createSign('RSA-SHA256')
  signer.update(canonicalPayload)
  signer.end()

  const signature = signer.sign(privateKeyPem)
  const token = `${TOKEN_PREFIX}.${encodeBase64Url(canonicalPayload)}.${encodeBase64Url(signature)}`

  return { payload: normalizedPayload, token }
}

export const computeLicenseStatus = (expiryDate, now = new Date()) => {
  const expiryAt = new Date(`${String(expiryDate).trim()}T23:59:59.999Z`)
  if (Number.isNaN(expiryAt.getTime())) {
    return 'invalid'
  }

  return now.getTime() > expiryAt.getTime() ? 'expired' : 'active'
}
