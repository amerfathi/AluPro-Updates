import { createServer } from 'http'
import { randomUUID } from 'crypto'
import { exec } from 'child_process'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { dirname, extname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { computeLicenseStatus, generateSignedToken } from './common.mjs'
import { DEFAULT_LICENSE_FEATURES, FEATURE_CATALOG } from './feature-catalog.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const args = process.argv.slice(2)

const readArg = (flag, fallback = '') => {
  const index = args.indexOf(flag)
  if (index === -1 || index + 1 >= args.length) return fallback
  return args[index + 1]
}

const hasFlag = (flag) => args.includes(flag)

const PORT = Number(readArg('--port', process.env['ALUAPP_LICENSE_ADMIN_PORT'] || '4381')) || 4381
const STORE_PATH = resolve(
  readArg('--store', process.env['ALUAPP_LICENSE_STORE'] || join(__dirname, 'admin-store.json'))
)
const UI_DIR = resolve(join(__dirname, 'admin-ui'))

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
}

const createDefaultStore = () => ({
  settings: {
    privateKeyPath: '',
    defaultPlan: 'pro',
    defaultFeatures: DEFAULT_LICENSE_FEATURES
  },
  customers: [],
  licenses: []
})

const allowedFeatureIds = new Set([...FEATURE_CATALOG.map((feature) => feature.id), 'all'])

function sanitizeFeatures(features) {
  return Array.isArray(features)
    ? features
        .map((entry) => String(entry || '').trim().toLowerCase())
        .filter(Boolean)
        .filter((featureId) => allowedFeatureIds.has(featureId))
    : []
}

const safeJsonParse = (content, fallback) => {
  try {
    return JSON.parse(content)
  } catch {
    return fallback
  }
}

const normalizeExistingFilePath = (candidatePath) => {
  const rawPath = String(candidatePath || '').trim()
  if (!rawPath) return ''

  const resolvedPath = resolve(rawPath)
  if (!existsSync(resolvedPath)) return ''

  try {
    const fileStat = statSync(resolvedPath)
    return fileStat.isFile() ? resolvedPath : ''
  } catch {
    return ''
  }
}

const buildPrivateKeyCandidates = (preferredPath = '') => {
  const userProfile = process.env['USERPROFILE'] || process.env['HOME'] || ''
  const storeDirectory = dirname(STORE_PATH)

  return [
    process.env['ALUAPP_LICENSE_PRIVATE_KEY_PATH'] || '',
    preferredPath,
    join(storeDirectory, 'private-key.pem'),
    join(storeDirectory, 'keys', 'private-key.pem'),
    join(process.cwd(), '.license-keys', 'private-key.pem'),
    join(process.cwd(), 'private-key.pem'),
    userProfile ? join(userProfile, 'Documents', 'AluProLicensing', 'private-key.pem') : ''
  ]
}

const detectPrivateKeyPath = (preferredPath = '') => {
  const seen = new Set()

  for (const candidatePath of buildPrivateKeyCandidates(preferredPath)) {
    const normalizedPath = normalizeExistingFilePath(candidatePath)
    if (!normalizedPath || seen.has(normalizedPath)) continue
    seen.add(normalizedPath)
    return normalizedPath
  }

  return ''
}

const ensureStoreDir = () => {
  mkdirSync(dirname(STORE_PATH), { recursive: true })
}

const normalizeStore = (raw) => {
  const baseline = createDefaultStore()
  const normalizedDefaultFeatures = sanitizeFeatures(raw?.settings?.defaultFeatures)
  const rawPrivateKeyPath = String(raw?.settings?.privateKeyPath || '').trim()
  const normalizedPrivateKeyPath = detectPrivateKeyPath(rawPrivateKeyPath) || rawPrivateKeyPath
  return {
    settings: {
      ...baseline.settings,
      ...(raw?.settings || {}),
      privateKeyPath: normalizedPrivateKeyPath,
      defaultFeatures:
        normalizedDefaultFeatures.length > 0 ? normalizedDefaultFeatures : baseline.settings.defaultFeatures
    },
    customers: Array.isArray(raw?.customers) ? raw.customers : [],
    licenses: Array.isArray(raw?.licenses) ? raw.licenses : []
  }
}

const loadStore = () => {
  ensureStoreDir()
  if (!existsSync(STORE_PATH)) {
    const baseline = createDefaultStore()
    saveStore(baseline)
    const normalizedBaseline = safeJsonParse(readFileSync(STORE_PATH, 'utf8'), baseline)
    return normalizeStore(normalizedBaseline)
  }

  const raw = safeJsonParse(readFileSync(STORE_PATH, 'utf8'), createDefaultStore())
  const normalized = normalizeStore(raw)
  saveStore(normalized)
  return normalized
}

const saveStore = (data) => {
  ensureStoreDir()
  writeFileSync(STORE_PATH, JSON.stringify(normalizeStore(data), null, 2), 'utf8')
}

const enrichState = (state) => ({
  ...state,
  licenses: state.licenses.map((license) => ({
    ...license,
    status: computeLicenseStatus(license.expiryDate)
  }))
})

const readBody = (req) =>
  new Promise((resolveBody, rejectBody) => {
    const chunks = []
    req.on('data', (chunk) => {
      chunks.push(chunk)
      const size = Buffer.concat(chunks).length
      if (size > 2_000_000) {
        rejectBody(new Error('payload_too_large'))
      }
    })
    req.on('end', () => {
      if (chunks.length === 0) {
        resolveBody({})
        return
      }
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        rejectBody(new Error('invalid_json'))
      }
    })
    req.on('error', rejectBody)
  })

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': CONTENT_TYPES['.json'],
    'Cache-Control': 'no-store'
  })
  res.end(JSON.stringify(payload))
}

const normalizeDateOnly = (value) => {
  const trimmed = String(value || '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : ''
}

const generateLicenseId = () => {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const short = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `LIC-${stamp}-${short}`
}

const activationErrorMessageByCode = {
  private_key_path_missing: 'يرجى تحديد مسار ملف المفتاح الخاص أولاً.',
  private_key_not_found: 'ملف المفتاح الخاص غير موجود في هذا المسار.',
  private_key_must_be_file: 'المسار المحدد ليس ملف مفتاح، بل مجلد.',
  private_key_error: 'حدث خطأ أثناء قراءة المفتاح الخاص.'
}

const updateStore = (mutator) => {
  const current = loadStore()
  const next = mutator(current)
  saveStore(next)
  return enrichState(loadStore())
}

const getPrivateKeyPem = (candidatePath) => {
  const rawPath = String(candidatePath || '').trim()
  const detectedPath = detectPrivateKeyPath(rawPath)
  if (detectedPath) {
    return { pem: readFileSync(detectedPath, 'utf8'), path: detectedPath }
  }

  if (!rawPath) {
    throw new Error('private_key_path_missing')
  }

  const fullPath = resolve(rawPath)
  if (!existsSync(fullPath)) {
    throw new Error('private_key_not_found')
  }

  const pathStat = statSync(fullPath)
  if (!pathStat.isFile()) {
    throw new Error('private_key_must_be_file')
  }

  return { pem: readFileSync(fullPath, 'utf8'), path: fullPath }
}

const serveStaticFile = (res, pathName) => {
  const resolvedPath = resolve(join(UI_DIR, pathName === '/' ? 'index.html' : pathName.slice(1)))
  if (!resolvedPath.startsWith(UI_DIR)) {
    sendJson(res, 403, { ok: false, error: 'forbidden' })
    return
  }

  if (!existsSync(resolvedPath)) {
    sendJson(res, 404, { ok: false, error: 'not_found' })
    return
  }

  const extension = extname(resolvedPath)
  const contentType = CONTENT_TYPES[extension] || 'application/octet-stream'
  const content = readFileSync(resolvedPath)
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store'
  })
  res.end(content)
}

const handleApi = async (req, res, url) => {
  const method = req.method || 'GET'
  const path = url.pathname

  if (method === 'GET' && path === '/api/state') {
    return sendJson(res, 200, {
      ok: true,
      state: enrichState(loadStore()),
      storePath: STORE_PATH,
      featureCatalog: FEATURE_CATALOG
    })
  }

  if (method === 'POST' && path === '/api/settings') {
    const body = await readBody(req)
    const normalizedDefaultFeatures = sanitizeFeatures(body.defaultFeatures)
    const nextState = updateStore((current) => ({
      ...current,
      settings: {
        ...current.settings,
        privateKeyPath: String(body.privateKeyPath || '').trim(),
        defaultPlan: String(body.defaultPlan || current.settings.defaultPlan || 'pro').trim(),
        defaultFeatures:
          normalizedDefaultFeatures.length > 0
            ? normalizedDefaultFeatures
            : current.settings.defaultFeatures
      }
    }))
    return sendJson(res, 200, { ok: true, state: nextState })
  }

  if (method === 'POST' && path === '/api/customers') {
    const body = await readBody(req)
    const name = String(body.name || '').trim()
    if (!name) {
      return sendJson(res, 400, { ok: false, error: 'customer_name_required' })
    }

    const nextState = updateStore((current) => ({
      ...current,
      customers: [
        ...current.customers,
        {
          id: randomUUID(),
          name,
          phone: String(body.phone || '').trim(),
          email: String(body.email || '').trim(),
          notes: String(body.notes || '').trim(),
          createdAt: new Date().toISOString()
        }
      ]
    }))
    return sendJson(res, 200, { ok: true, state: nextState })
  }

  const customerIdMatch = path.match(/^\/api\/customers\/([^/]+)$/)
  if (customerIdMatch && method === 'PUT') {
    const customerId = decodeURIComponent(customerIdMatch[1])
    const body = await readBody(req)
    const nextState = updateStore((current) => ({
      ...current,
      customers: current.customers.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              name: String(body.name || customer.name || '').trim(),
              phone: String(body.phone ?? customer.phone ?? '').trim(),
              email: String(body.email ?? customer.email ?? '').trim(),
              notes: String(body.notes ?? customer.notes ?? '').trim()
            }
          : customer
      )
    }))
    return sendJson(res, 200, { ok: true, state: nextState })
  }

  if (customerIdMatch && method === 'DELETE') {
    const customerId = decodeURIComponent(customerIdMatch[1])
    const current = loadStore()
    const linkedLicenses = current.licenses.filter((license) => license.customerId === customerId)
    if (linkedLicenses.length > 0) {
      return sendJson(res, 400, {
        ok: false,
        error: 'customer_has_licenses',
        message: 'لا يمكن حذف العميل قبل حذف/أرشفة تراخيصه.'
      })
    }

    const nextState = updateStore((snapshot) => ({
      ...snapshot,
      customers: snapshot.customers.filter((customer) => customer.id !== customerId)
    }))
    return sendJson(res, 200, { ok: true, state: nextState })
  }

  if (method === 'POST' && path === '/api/licenses/generate') {
    const body = await readBody(req)
    const current = loadStore()

    const customerId = String(body.customerId || '').trim()
    const customer = current.customers.find((entry) => entry.id === customerId)
    if (!customer) {
      return sendJson(res, 400, { ok: false, error: 'customer_not_found' })
    }

    const hwid = String(body.hwid || '').trim().toUpperCase()
    if (!hwid) {
      return sendJson(res, 400, { ok: false, error: 'hwid_required' })
    }

    const expiryDate = normalizeDateOnly(body.expiryDate)
    if (!expiryDate) {
      return sendJson(res, 400, { ok: false, error: 'expiry_date_invalid' })
    }

    const privateKeyPath = String(body.privateKeyPath || current.settings.privateKeyPath || '').trim()
    let privateKeyPem = ''
    let normalizedPrivateKeyPath = ''
    try {
      const key = getPrivateKeyPem(privateKeyPath)
      privateKeyPem = key.pem
      normalizedPrivateKeyPath = key.path
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'private_key_error'
      return sendJson(res, 400, {
        ok: false,
        error: errorCode,
        message: activationErrorMessageByCode[errorCode] || 'تعذر قراءة المفتاح الخاص.'
      })
    }

    const plan = String(body.plan || current.settings.defaultPlan || 'pro').trim()
    const requestedFeatures = sanitizeFeatures(
      body.features?.length ? body.features : current.settings.defaultFeatures
    )
    const fallbackFeatures = sanitizeFeatures(current.settings.defaultFeatures)
    const features =
      requestedFeatures.length > 0
        ? requestedFeatures
        : fallbackFeatures.length > 0
          ? fallbackFeatures
          : DEFAULT_LICENSE_FEATURES
    const licenseId = String(body.licenseId || generateLicenseId()).trim()
    const issuedAt = new Date().toISOString()

    const { token } = generateSignedToken({
      payload: {
        v: 1,
        licenseId,
        hwid,
        expiryDate,
        issuedAt,
        plan,
        customer: customer.name,
        features
      },
      privateKeyPem
    })

    const nextState = updateStore((snapshot) => ({
      ...snapshot,
      settings: {
        ...snapshot.settings,
        privateKeyPath: normalizedPrivateKeyPath
      },
      licenses: [
        ...snapshot.licenses,
        {
          id: randomUUID(),
          licenseId,
          customerId: customer.id,
          customerName: customer.name,
          hwid,
          expiryDate,
          issuedAt,
          createdAt: issuedAt,
          updatedAt: issuedAt,
          plan,
          features,
          notes: String(body.notes || '').trim(),
          token
        }
      ]
    }))

    const createdLicense = nextState.licenses[nextState.licenses.length - 1]
    return sendJson(res, 200, {
      ok: true,
      token,
      license: createdLicense,
      state: nextState
    })
  }

  const licenseIdMatch = path.match(/^\/api\/licenses\/([^/]+)$/)
  if (licenseIdMatch && method === 'DELETE') {
    const id = decodeURIComponent(licenseIdMatch[1])
    const nextState = updateStore((current) => ({
      ...current,
      licenses: current.licenses.filter((license) => license.id !== id)
    }))
    return sendJson(res, 200, { ok: true, state: nextState })
  }

  if (licenseIdMatch && method === 'PUT') {
    const id = decodeURIComponent(licenseIdMatch[1])
    const body = await readBody(req)
    const nextState = updateStore((current) => ({
      ...current,
      licenses: current.licenses.map((license) =>
        license.id === id
          ? {
              ...license,
              notes: String(body.notes ?? license.notes ?? '').trim(),
              updatedAt: new Date().toISOString()
            }
          : license
      )
    }))
    return sendJson(res, 200, { ok: true, state: nextState })
  }

  return sendJson(res, 404, { ok: false, error: 'api_not_found' })
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || `localhost:${PORT}`}`)

  try {
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url)
      return
    }

    serveStaticFile(res, url.pathname)
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'internal_error'
    })
  }
})

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`
  console.log(`License Admin Tool is running at ${url}`)
  console.log(`Store path: ${STORE_PATH}`)

  if (hasFlag('--open')) {
    const openCommand =
      process.platform === 'win32'
        ? `start "" "${url}"`
        : process.platform === 'darwin'
          ? `open "${url}"`
          : `xdg-open "${url}"`

    exec(openCommand, () => {})
  }
})
