import { generateKeyPairSync } from 'crypto'
import { mkdirSync, existsSync, writeFileSync, copyFileSync } from 'fs'
import { dirname, join, resolve } from 'path'

const args = process.argv.slice(2)

const readArg = (flag, fallback = '') => {
  const index = args.indexOf(flag)
  if (index === -1 || index + 1 >= args.length) return fallback
  return args[index + 1]
}

const hasFlag = (flag) => args.includes(flag)

const outDir = resolve(readArg('--out-dir', '.license-keys'))
const copyPublicTo = resolve(readArg('--copy-public-to', 'resources/license-public-key.pem'))
const force = hasFlag('--force')

const privateKeyPath = join(outDir, 'private-key.pem')
const publicKeyPath = join(outDir, 'public-key.pem')

if (!force && (existsSync(privateKeyPath) || existsSync(publicKeyPath))) {
  console.error('Key files already exist. Use --force to overwrite.')
  process.exit(1)
}

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 3072,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
})

mkdirSync(outDir, { recursive: true })
writeFileSync(privateKeyPath, privateKey, { encoding: 'utf8', mode: 0o600 })
writeFileSync(publicKeyPath, publicKey, { encoding: 'utf8' })

mkdirSync(dirname(copyPublicTo), { recursive: true })
copyFileSync(publicKeyPath, copyPublicTo)

console.log('Offline license keypair generated successfully.')
console.log(`Private key: ${privateKeyPath}`)
console.log(`Public key : ${publicKeyPath}`)
console.log(`Bundled public key copied to: ${copyPublicTo}`)
