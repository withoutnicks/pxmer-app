import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Action, SessionState } from "@shared/session";
import type { Settings } from "@shared/settings";

/**
 * Bridge consumed by the renderer. Maps the app's operations onto Tauri IPC:
 * commands for request/response and events for the timer state stream.
 */
export interface PXmerAPI {
  getSettings: () => Promise<Settings>;
  saveSettings: (settings: Settings) => Promise<void>;
  sessionStart: () => Promise<SessionState>;
  sessionDispatch: (action: Action) => Promise<SessionState>;
  onSessionState: (callback: (state: SessionState) => void) => () => void;
}

const SESSION_STATE_EVENT = "session-state";

export const api: PXmerAPI = {
  getSettings: () => invoke<Settings>("get_settings"),
  saveSettings: (settings) => invoke<void>("save_settings", { settings }),
  sessionStart: () => invoke<SessionState>("session_start"),
  sessionDispatch: (action) => invoke<SessionState>("session_dispatch", { action }),
  // `listen` is async but the contract is a synchronous unsubscribe, so the
  // stop handle is captured lazily. If the caller already disposed before the
  // registration resolves (React StrictMode mounts effects twice in dev),
  // the late listener is stopped immediately.
  onSessionState: (callback) => {
    let unlisten: (() => void) | null = null;
    let disposed = false;
    void listen<SessionState>(SESSION_STATE_EVENT, (event) =>
      callback(event.payload)
    ).then((stop) => {
      if (disposed) stop();
      else unlisten = stop;
    });
    return () => {
      disposed = true;
      unlisten?.();
    };
  },
};
