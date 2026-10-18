import type { Settings } from "@shared/settings";
import type { Action, SessionState } from "@shared/session";

declare global {
  interface Window {
    pxmer: {
      getSettings: () => Promise<Settings>;
      saveSettings: (settings: Settings) => Promise<void>;
      showNotification: (title: string, body: string) => Promise<void>;
      sessionStart: () => Promise<SessionState>;
      sessionDispatch: (action: Action) => Promise<SessionState>;
      sessionGet: () => Promise<SessionState>;
      onSessionState: (callback: (state: SessionState) => void) => () => void;
    };
  }
}

export {};
