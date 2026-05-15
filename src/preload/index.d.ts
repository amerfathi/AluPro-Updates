import type { ElectronAPI } from '@electron-toolkit/preload'

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

declare global {
  interface Window {
    electron: CustomElectronAPI
    api: Record<string, never>
  }
}

export {}
