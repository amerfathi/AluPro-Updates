import { readFileSync } from 'fs'
import { resolve } from 'path'
import { generateSignedToken, normalizePayload } from './common.mjs'

const args = process.argv.slice(2)

const readArg = (flag, fallback = '') => {
  const index = args.indexOf(flag)
  if (index === -1 || index + 1 >= args.length) return fallback
  return args[index + 1]
}

const required = (flag, name) => {
  const value = readArg(flag, '')
  if (!value) {
    console.error(`Missing required argument: ${name} (${flag})`)
    process.exit(1)
  }
  return value
}

const privateKeyPath = resolve(required('--private-key', 'private key path'))
const hwid = required('--hwid', 'hardware id')
const expiryDate = required('--expiry', 'expiry date')
const licenseId = readArg('--license-id', `LIC-${Date.now()}`)
const plan = readArg('--plan', '')
const customer = readArg('--customer', '')
const featuresRaw = readArg('--features', '')
const features = featuresRaw
  ? featuresRaw
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  : undefined

const payload = normalizePayload({
  v: 1,
  licenseId,
  hwid,
  expiryDate,
  issuedAt: new Date().toISOString(),
  plan: plan || undefined,
  customer: customer || undefined,
  features
})

const privateKeyPem = readFileSync(privateKeyPath, 'utf8')
const { token } = generateSignedToken({ payload, privateKeyPem })

console.log('License generated successfully:')
console.log(token)
