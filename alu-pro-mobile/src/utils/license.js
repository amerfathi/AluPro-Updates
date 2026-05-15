export const APP_VERSION = '3.0.0 PRO - PRODUCTION EDITION'

const SECRET = 'AMER_ULTRA_FRAME_2026_MASTER_KEY'

export const decodeLicenseKey = (formattedHex) => {
  try {
    const hex = formattedHex.replace(/-/g, '')
    let decoded = ''

    for (let index = 0; index < hex.length; index += 2) {
      const charCode =
        parseInt(hex.substr(index, 2), 16) ^ SECRET.charCodeAt((index / 2) % SECRET.length)
      decoded += String.fromCharCode(charCode)
    }

    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export const getOnlineDate = async () => {
  try {
    const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC')
    const data = await response.json()

    return new Date(data.utc_datetime)
  } catch {
    return new Date()
  }
}
