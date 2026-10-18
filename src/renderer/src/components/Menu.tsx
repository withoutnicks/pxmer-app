import type { JSX } from "react";
import type { Settings } from "@shared/settings";
import { BreakLimitIcon, ThemeIcon, WorkDurationIcon } from "./Icons";
import { BREAK_RANGE, WORK_RANGE } from "../utils/constants";

/**
 * Menú inicial: ajustes de la sesión y el botón para arrancar. Los cambios
 * de ajuste no afectan a la sesión en curso, solo a la siguiente.
 */
export function Menu({
  settings,
  workValid,
  breakValid,
  canStart,
  onStart,
  onThemeToggle,
  onWorkMinutesChange,
  onBreakLimitChange,
}: {
  settings: Settings;
  workValid: boolean;
  breakValid: boolean;
  canStart: boolean;
  onStart: () => void;
  onThemeToggle: () => void;
  onWorkMinutesChange: (raw: string) => void;
  onBreakLimitChange: (raw: string) => void;
}): JSX.Element {
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
            onClick={onThemeToggle}
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
            min={WORK_RANGE.min}
            max={WORK_RANGE.max}
            onChange={(event) => onWorkMinutesChange(event.target.value)}
          />
          {!workValid && (
            <span className="hint hint-error">
              Fuera de rango: {WORK_RANGE.min} a {WORK_RANGE.max}.
            </span>
          )}
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
            min={BREAK_RANGE.min}
            max={BREAK_RANGE.max}
            onChange={(event) => onBreakLimitChange(event.target.value)}
          />
          {!breakValid && (
            <span className="hint hint-error">
              Fuera de rango: {BREAK_RANGE.min} a {BREAK_RANGE.max}.
            </span>
          )}
        </label>
      </main>
      <button
        className="start-btn"
        onClick={onStart}
        disabled={!canStart}
      >
        Iniciar -&gt;
      </button>
    </div>
  );
}
