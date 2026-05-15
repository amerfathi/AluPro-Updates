import { useEffect, useState } from 'react'

const DEVICE_ID_STORAGE_KEY = 'aluApp_device_id'

const createFallbackDeviceId = () => `HW-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

const getStoredDeviceId = () => {
  const stored = localStorage.getItem(DEVICE_ID_STORAGE_KEY)
  return stored || ''
}

export const useDeviceId = () => {
  const [deviceId, setDeviceId] = useState(() => getStoredDeviceId())

  useEffect(() => {
    let isMounted = true
    const storedDeviceId = getStoredDeviceId()

    window.electron.ipcRenderer
      .invoke('get_device_id')
      .then((resolvedDeviceId) => {
        if (typeof resolvedDeviceId !== 'string' || !resolvedDeviceId.trim()) {
          return
        }

        localStorage.setItem(DEVICE_ID_STORAGE_KEY, resolvedDeviceId)

        if (isMounted) {
          setDeviceId(resolvedDeviceId)
        }
      })
      .catch(() => {
        const fallbackDeviceId = storedDeviceId || createFallbackDeviceId()
        localStorage.setItem(DEVICE_ID_STORAGE_KEY, fallbackDeviceId)
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
