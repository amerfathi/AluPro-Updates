import { useEffect, useState } from 'react'

export const useAutoUpdater = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [updateReady, setUpdateReady] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [updateError, setUpdateError] = useState(null)

  const startDownload = () => {
    setIsDownloading(false)
    setUpdateReady(false)
    setUpdateError(null)
  }

  const restartAndInstall = () => {
    setUpdateReady(false)
  }

  useEffect(() => {
    setUpdateAvailable(false)
    setDownloadProgress(0)
    setUpdateReady(false)
    setIsDownloading(false)
    setUpdateError(null)

    return undefined
  }, [])

  return {
    updateAvailable,
    downloadProgress,
    updateReady,
    isDownloading,
    updateError,
    startDownload,
    restartAndInstall
  }
}
