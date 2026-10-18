import type { JSX } from "react";
import type { Action, SessionState } from "@shared/session";
import { useTapSound } from "../hooks/useSounds";

type Dispatch = (action: Action) => void;

/**
 * Solo muestra las acciones que aplican a la fase actual. El resto no se
 * renderiza: main ignora lo que no corresponde, así que no hace falta
 * deshabilitar nada.
 */
function actionsFor(
  state: SessionState,
  dispatch: Dispatch,
  workMinutes: number
): JSX.Element[] {
  const playTapSound = useTapSound();

  const reset: JSX.Element = (
    <button
      key="reset"
      type="button"
      className="timer-btn"
      onClick={() => { playTapSound(); dispatch({ type: "RESET" }) }}
    >
      Terminar
    </button>
  );

  switch (state.kind) {
    case "work":
      return [
        <button
          key="pause"
          type="button"
          className="timer-btn"
          onClick={() => { playTapSound(); dispatch({ type: "PAUSE", at: Date.now() }) }}
        >
          Pausar
        </button>,
        reset,
      ];
    case "workPaused":
      return [
        <button
          key="resume"
          type="button"
          className="timer-btn"
          onClick={() => { playTapSound(); dispatch({ type: "RESUME", at: Date.now() }) }}
        >
          Reanudar
        </button>,
        reset,
      ];
    case "break":
      return [
        <button
          key="next"
          type="button"
          className="timer-btn"
          onClick={() => {
            playTapSound();
            dispatch({
              type: "NEXT_WORK",
              workMin: workMinutes,
              at: Date.now(),
            })
          }
          }
        >
          Siguiente
        </button>,
        reset,
      ];
    // En el límite las acciones las ofrece el popup, no la barra de botones.
    case "breakLimit":
      return [];
    case "idle":
      return [];
  }
}

export function TimerActions({
  state,
  dispatch,
  workMinutes,
}: {
  state: SessionState;
  dispatch: Dispatch;
  workMinutes: number;
}): JSX.Element | null {
  const actions = actionsFor(state, dispatch, workMinutes);
  if (actions.length === 0) return null;

  return <main className="timer-actions">{actions}</main>;
}