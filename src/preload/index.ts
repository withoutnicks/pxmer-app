import { contextBridge, ipcRenderer } from 'electron'
import type { Settings } from '../shared/settings'
import type { Action, SessionState } from '../shared/session'

export interface PXmerAPI {
  getSettings: () => Promise<Settings>
  saveSettings: (settings: Settings) => Promise<void>
  showNotification: (title: string, body: string) => Promise<void>
  sessionStart: () => Promise<SessionState>
  sessionDispatch: (action: Action) => Promise<SessionState>
  sessionGet: () => Promise<SessionState>
  onSessionState: (callback: (state: SessionState) => void) => () => void
}

const api: PXmerAPI = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Settings) => ipcRenderer.invoke('save-settings', settings),
  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke('show-notification', title, body),
  sessionStart: () => ipcRenderer.invoke('session-start'),
  sessionDispatch: (action: Action) => ipcRenderer.invoke('session-dispatch', action),
  sessionGet: () => ipcRenderer.invoke('session-get'),
  // Devuelve la función para dejar de escuchar, para poder limpiarla en el cleanup.
  onSessionState: (callback: (state: SessionState) => void) => {
    const listener = (_event: unknown, state: SessionState): void => callback(state)
    ipcRenderer.on('session-state', listener)
    return () => {
      ipcRenderer.removeListener('session-state', listener)
    }
  }
}

contextBridge.exposeInMainWorld('pxmer', api)