import type { JSX } from "react";
import type { Action, SessionState } from "@shared/session";
import type { Settings } from "@shared/settings";
import { TimerClock } from "./TimerClock";
import { TimerActions } from "./TimerActions";
import { BreakLimitDialog } from "./BreakLimitDialog";

/**
 * Pantalla de sesión en curso. El reloj, la barra de acciones y el popup del
 * límite se pintan a partir del estado que manda el proceso main.
 */
export function TimerView({
  settings,
  session,
  dispatch,
}: {
  settings: Settings;
  session: SessionState;
  dispatch: (action: Action) => void;
}): JSX.Element {
  return (
    <div className="timer-view">
      <TimerClock state={session} />
      <TimerActions
        state={session}
        dispatch={dispatch}
        workMinutes={settings.workMinutes}
      />
      <BreakLimitDialog
        state={session}
        dispatch={dispatch}
        workMinutes={settings.workMinutes}
      />
    </div>
  );
}
