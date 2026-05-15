import { createHash } from 'crypto'
import { arch, hostname, networkInterfaces, platform } from 'os'

export function getStableDeviceId(): string {
  const macAddresses = Object.values(networkInterfaces())
    .flat()
    .filter((details): details is NonNullable<typeof details> => Boolean(details))
    .filter((details) => !details.internal && details.mac && details.mac !== '00:00:00:00:00:00')
    .map((details) => details.mac)
    .sort()

  const fingerprint = [hostname(), platform(), arch(), ...macAddresses].join('|')
  const hash = createHash('sha256').update(fingerprint).digest('hex').slice(0, 12).toUpperCase()

  return `PC-${hash}`
}
