import { useState, useEffect, JSX } from "react";
import {
  BreakLimitIcon,
  ThemeIcon,
  WorkDurationIcon,
} from "./components/Icons";
import type { Settings, Theme } from "../../shared/settings";
import "./App.css";

declare global {
  interface Window {
    pxmer: {
      getSettings: () => Promise<Settings>;
      saveSettings: (settings: Settings) => Promise<void>;
      showNotification: (title: string, body: string) => Promise<void>;
    };
  }
}

function App(): JSX.Element {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    window.pxmer.getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (settings) {
      document.documentElement.dataset.theme = settings.theme;
    }
  }, [settings?.theme]);

  const update = (patch: Partial<Settings>): void => {
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleStart = async (): Promise<void> => {
    if (!settings) return;
    await window.pxmer.saveSettings(settings);
    setStarted(true);
  };

  const handleThemeToggle = async (): Promise<void> => {
    if (!settings) return;
    const nextTheme: Theme = settings.theme === "dark" ? "light" : "dark";
    const next = { ...settings, theme: nextTheme };
    setSettings(next);
    await window.pxmer.saveSettings(next);
  };

  if (!settings) {
    return (
      <div className="loading">
        <span className="dot">.</span>
      </div>
    );
  }

  if (started) {
    return <TimerView />;
  }

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1 className="title degrade">PXmer</h1>
          <p className="subtitle">un visualizador simple de tu tiempo</p>
        </div>
        <section>
          <button
            type="button"
            className="nav-btn"
            aria-label={
              settings.theme === "dark"
                ? "Cambiar a tema claro"
                : "Cambiar a tema oscuro"
            }
            title={
              settings.theme === "dark"
                ? "Cambiar a tema claro"
                : "Cambiar a tema oscuro"
            }
            onClick={handleThemeToggle}
          >
            <ThemeIcon theme={settings.theme} />
          </button>
        </section>
      </header>

      <main className="form">
        <label className="field">
          <span className="label">
            <WorkDurationIcon />
            Duración del trabajo <span className="hint">(min)</span>
          </span>
          <input
            type="number"
            className="input"
            value={settings.workMinutes}
            min={5}
            max={90}
            onChange={(event) =>
              update({ workMinutes: Number(event.target.value) })
            }
          />
          <span className="hint">5 – 90 minutos</span>
        </label>

        <label className="field">
          <span className="label">
            <BreakLimitIcon />
            Límite del descanso <span className="hint">(min)</span>
          </span>
          <input
            type="number"
            className="input"
            value={settings.breakLimit}
            min={1}
            max={20}
            onChange={(event) =>
              update({ breakLimit: Number(event.target.value) })
            }
          />
          <span className="hint">1 – 20 minutos</span>
        </label>
      </main>
      <button className="start-btn" onClick={handleStart}>
        Iniciar -&gt;
      </button>
    </div>
  );
}

// Minimal timer placeholder — full logic comes in Etapa 2
function TimerView(): JSX.Element {
  return (
    <p style={{ textAlign: "center", marginTop: 20, color: "var(--muted)" }}>
      Etapa 2 en progreso…
    </p>
  );
}

export default App;
