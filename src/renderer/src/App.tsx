import { useEffect, useState, type JSX } from "react";
import type { Settings, Theme } from "@shared/settings";
import type { Action, SessionState } from "@shared/session";
import { Menu } from "./components/Menu";
import { TimerView } from "./components/TimerView";
import { useSessionKeys } from "./hooks/useSessionKeys";
import { useTapSound, useToggleSound } from "./hooks/useSounds";
import { BREAK_RANGE, WORK_RANGE, isInRange } from "./utils/constants";
import "./styles/App.css";

function App(): JSX.Element {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [session, setSession] = useState<SessionState>({ kind: "idle" });
  const playTap = useTapSound();
  const playToggle = useToggleSound();

  // El proceso main manda el estado; el renderer solo lo pinta.
  useEffect(() => {
    const stop = window.pxmer.onSessionState(setSession);
    return stop;
  }, []);

  useEffect(() => {
    window.pxmer.getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (settings) {
      document.documentElement.dataset.theme = settings.theme;
    }
  }, [settings?.theme]);

  const dispatch = (action: Action): void => {
    window.pxmer.sessionDispatch(action).then(setSession);
  };

  const update = (patch: Partial<Settings>): void => {
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  useSessionKeys({
    state: session,
    dispatch,
    workMinutes: settings?.workMinutes ?? WORK_RANGE.min,
  });

  if (!settings) {
    return (
      <div className="loading">
        <span className="dot">.</span>
      </div>
    );
  }

  const workValid = isInRange(settings.workMinutes, WORK_RANGE);
  const breakValid = isInRange(settings.breakLimit, BREAK_RANGE);
  const canStart = workValid && breakValid;

  const handleStart = async (): Promise<void> => {
    if (!canStart) return;
    await window.pxmer.saveSettings(settings);
    // Arranca el reloj de main y le pide que arranque el trabajo.
    playTap();
    await window.pxmer.sessionStart();
    dispatch({
      type: "START_WORK",
      workMin: settings.workMinutes,
      at: Date.now(),
    });
  };

  const handleThemeToggle = async (): Promise<void> => {
    const nextTheme: Theme = settings.theme === "dark" ? "light" : "dark";
    const next = { ...settings, theme: nextTheme };
    playToggle();
    setSettings(next);
    await window.pxmer.saveSettings(next);
  };

  if (session.kind !== "idle") {
    return (
      <TimerView
        settings={settings}
        session={session}
        dispatch={dispatch}
      />
    );
  }

  return (
    <Menu
      settings={settings}
      workValid={workValid}
      breakValid={breakValid}
      canStart={canStart}
      onStart={() => void handleStart()}
      onThemeToggle={() => void handleThemeToggle()}
      onWorkMinutesChange={(raw) => update({ workMinutes: Number(raw) })}
      onBreakLimitChange={(raw) => update({ breakLimit: Number(raw) })}
    />
  );
}

export default App;
