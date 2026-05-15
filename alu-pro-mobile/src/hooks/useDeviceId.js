import { useEffect, useState } from 'react'
import { Device } from '@capacitor/device'

const DEVICE_ID_STORAGE_KEY = 'aluApp_device_id'

const createFallbackDeviceId = () => `HW-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

const getStoredDeviceId = () => {
  const stored = localStorage.getItem(DEVICE_ID_STORAGE_KEY)

  if (stored) {
    return stored
  }

  const fallbackDeviceId = createFallbackDeviceId()
  localStorage.setItem(DEVICE_ID_STORAGE_KEY, fallbackDeviceId)
  return fallbackDeviceId
}

export const useDeviceId = () => {
  const [deviceId, setDeviceId] = useState(() => getStoredDeviceId())

  useEffect(() => {
    let isMounted = true
    const fallbackDeviceId = getStoredDeviceId()

    Device.getId()
      .then(({ identifier }) => {
        if (typeof identifier !== 'string' || !identifier.trim()) {
          return
        }

        localStorage.setItem(DEVICE_ID_STORAGE_KEY, identifier)

        if (isMounted) {
          setDeviceId(identifier)
        }
      })
      .catch(() => {
        if (isMounted) {
          setDeviceId(fallbackDeviceId)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return deviceId
}
