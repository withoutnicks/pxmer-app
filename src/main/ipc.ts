import { ipcMain, Notification, type BrowserWindow } from "electron";
import { loadSettings, saveSettings } from "./store";
import { SessionController } from "./session";
import type { Action, SessionState } from "@shared/session";

/**
 * Registra los handlers IPC que usa el renderer y crea el controlador de
 * sesión. Se devuelve el controlador para que index.ts pueda detenerlo al
 * cerrar la app.
 *
 * El controlador es el dueño único del reloj: cada tick manda el estado al
 * renderer vía `session-state`.
 */
export function registerIpcHandlers(
  getMainWindow: () => BrowserWindow | null
): SessionController {
  const session = new SessionController({
    getWorkMinutes: () => loadSettings().workMinutes,
    getBreakLimit: () => loadSettings().breakLimit,
    onChange: (state: SessionState) => {
      getMainWindow()?.webContents.send("session-state", state);
    },
    onBreakLimit: () => {
      if (Notification.isSupported()) {
        new Notification({
          title: "PXmer",
          body: "Alcanzaste el límite del descanso.",
        }).show();
      }
    },
  });

  ipcMain.handle("get-settings", () => loadSettings());
  ipcMain.handle("save-settings", (_, settings) => saveSettings(settings));

  ipcMain.handle("session-start", () => {
    session.start();
    return session.getState();
  });
  ipcMain.handle("session-dispatch", (_, action: Action) => {
    session.dispatch(action);
    return session.getState();
  });
  ipcMain.handle("session-get", () => session.getState());

  ipcMain.handle("show-notification", (_, title: string, body: string) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  });

  return session;
}
