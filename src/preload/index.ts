import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI, type ElectronAPI } from '@electron-toolkit/preload'

type AppIpcListener = (...args: unknown[]) => void

type AppIpcRenderer = {
  send: (channel: string, ...args: unknown[]) => void
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
  on: (channel: string, listener: AppIpcListener) => () => void
  removeAllListeners: (channel: string) => void
}

type CustomElectronAPI = Omit<ElectronAPI, 'ipcRenderer'> & {
  ipcRenderer: AppIpcRenderer
}

const api: Record<string, never> = {}

const appIpcRenderer: AppIpcRenderer = {
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, listener) => {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]): void => {
      listener(...args)
    }

    ipcRenderer.on(channel, subscription)

    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
}

const electronBridge: CustomElectronAPI = {
  ...electronAPI,
  ipcRenderer: appIpcRenderer
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronBridge)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronBridge
  // @ts-ignore (define in dts)
  window.api = api
}
