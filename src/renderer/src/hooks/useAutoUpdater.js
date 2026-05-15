import { useEffect, useState } from 'react'

export const useAutoUpdater = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [updateReady, setUpdateReady] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [updateError, setUpdateError] = useState(null)

  const startDownload = () => {
    setIsDownloading(true)
    setUpdateReady(false)
    setUpdateError(null)
    window.electron.ipcRenderer.send('start_download')
  }

  const restartAndInstall = () => {
    window.electron.ipcRenderer.send('restart_app')
  }

  useEffect(() => {
    const removeUpdateAvailableListener = window.electron.ipcRenderer.on('update_available', () => {
      setUpdateAvailable(true)
      setUpdateReady(false)
      setUpdateError(null)
    })

    const removeDownloadProgressListener = window.electron.ipcRenderer.on(
      'download_progress',
      (progress) => {
        if (typeof progress === 'number') {
          setDownloadProgress(progress)
        }
      }
    )

    const removeUpdateDownloadedListener = window.electron.ipcRenderer.on(
      'update_downloaded',
      () => {
        setIsDownloading(false)
        setUpdateReady(true)
        setDownloadProgress(100)
      }
    )

    const removeUpdateErrorListener = window.electron.ipcRenderer.on('update_error', (message) => {
      setIsDownloading(false)
      setUpdateError(
        typeof message === 'string' && message.trim()
          ? message
          : 'تعذر إكمال التحديث. تحقق من الاتصال ثم حاول مرة أخرى.'
      )
    })

    return () => {
      removeUpdateAvailableListener()
      removeDownloadProgressListener()
      removeUpdateDownloadedListener()
      removeUpdateErrorListener()
    }
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
