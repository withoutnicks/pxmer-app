import { contextBridge, ipcRenderer } from 'electron'
import type { Settings } from '../shared/settings'

export interface PXmerAPI {
  getSettings: () => Promise<Settings>
  saveSettings: (settings: Settings) => Promise<void>
  showNotification: (title: string, body: string) => Promise<void>
}

const api: PXmerAPI = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Settings) => ipcRenderer.invoke('save-settings', settings),
  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke('show-notification', title, body)
}

contextBridge.exposeInMainWorld('pxmer', api)
