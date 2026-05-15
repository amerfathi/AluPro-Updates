import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname } from 'path'
import {
  type LicensePayload,
  verifyLicenseSignature,
  validateLicenseRuntime
} from './license-core'

type StoredLicenseState = {
  v: 1
  token: string
  activatedAt: string
  lastValidatedAt: string
}

export type LicenseStatus = {
  isActivated: boolean
  expiryDate: string | null
  hwid: string
  reason?: string
  licenseId?: string
  plan?: string
  features?: string[]
}

export type ActivationResult = {
  ok: boolean
  message: string
  status: LicenseStatus
}

const createInactiveStatus = (hwid: string, reason: string): LicenseStatus => ({
  isActivated: false,
  expiryDate: null,
  hwid,
  reason
})

const createActiveStatus = (hwid: string, payload: LicensePayload): LicenseStatus => ({
  isActivated: true,
  expiryDate: payload.expiryDate,
  hwid,
  licenseId: payload.licenseId,
  plan: payload.plan,
  features: payload.features
})

const safeReadState = (filePath: string): StoredLicenseState | null => {
  try {
    if (!existsSync(filePath)) {
      return null
    }

    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<StoredLicenseState>
    if (
      parsed &&
      parsed.v === 1 &&
      typeof parsed.token === 'string' &&
      typeof parsed.activatedAt === 'string' &&
      typeof parsed.lastValidatedAt === 'string'
    ) {
      return parsed as StoredLicenseState
    }
  } catch {
    return null
  }

  return null
}

const writeState = (filePath: string, state: StoredLicenseState): void => {
  const parentDir = dirname(filePath)
  mkdirSync(parentDir, { recursive: true })
  writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8')
}

export class OfflineLicenseService {
  private readonly stateFilePath: string
  private readonly publicKeyPem: string
  private readonly resolveHardwareId: () => string
  private readonly now: () => Date
  private readonly rollbackToleranceMinutes: number

  constructor({
    stateFilePath,
    publicKeyPem,
    resolveHardwareId,
    now = () => new Date(),
    rollbackToleranceMinutes = 5
  }: {
    stateFilePath: string
    publicKeyPem: string
    resolveHardwareId: () => string
    now?: () => Date
    rollbackToleranceMinutes?: number
  }) {
    this.stateFilePath = stateFilePath
    this.publicKeyPem = publicKeyPem
    this.resolveHardwareId = resolveHardwareId
    this.now = now
    this.rollbackToleranceMinutes = rollbackToleranceMinutes
  }

  getStatus(): LicenseStatus {
    const hwid = this.resolveHardwareId()
    const state = safeReadState(this.stateFilePath)
    if (!state) {
      return createInactiveStatus(hwid, 'not_activated')
    }

    const signature = verifyLicenseSignature(state.token, this.publicKeyPem)
    if (!signature.ok) {
      return createInactiveStatus(hwid, signature.reason)
    }

    const runtime = validateLicenseRuntime({
      payload: signature.payload,
      currentDeviceId: hwid,
      now: this.now(),
      lastValidatedAt: state.lastValidatedAt,
      rollbackToleranceMinutes: this.rollbackToleranceMinutes
    })

    if (runtime.code !== 'ok') {
      return createInactiveStatus(hwid, runtime.code)
    }

    const nowIso = this.now().toISOString()
    writeState(this.stateFilePath, {
      ...state,
      lastValidatedAt: nowIso
    })

    return createActiveStatus(hwid, signature.payload)
  }

  activateToken(token: string): ActivationResult {
    const hwid = this.resolveHardwareId()
    const signature = verifyLicenseSignature(token, this.publicKeyPem)
    if (!signature.ok) {
      return {
        ok: false,
        message: 'تعذر التحقق من توقيع الترخيص.',
        status: createInactiveStatus(hwid, signature.reason)
      }
    }

    const runtime = validateLicenseRuntime({
      payload: signature.payload,
      currentDeviceId: hwid,
      now: this.now(),
      rollbackToleranceMinutes: this.rollbackToleranceMinutes
    })

    if (runtime.code !== 'ok') {
      return {
        ok: false,
        message: 'الترخيص غير صالح لهذا الجهاز أو منتهي.',
        status: createInactiveStatus(hwid, runtime.code)
      }
    }

    const nowIso = this.now().toISOString()
    try {
      writeState(this.stateFilePath, {
        v: 1,
        token: token.trim(),
        activatedAt: nowIso,
        lastValidatedAt: nowIso
      })
    } catch {
      return {
        ok: false,
        message: 'تعذر حفظ التفعيل على هذا الجهاز. تحقق من صلاحيات مجلد البيانات ثم حاول مرة أخرى.',
        status: createInactiveStatus(hwid, 'state_persist_failed')
      }
    }

    return {
      ok: true,
      message: `تم التفعيل بنجاح. صالح حتى: ${signature.payload.expiryDate}`,
      status: createActiveStatus(hwid, signature.payload)
    }
  }
}
