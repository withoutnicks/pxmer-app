import type { JSX } from "react";
import type { Action, SessionState } from "@shared/session";
import { useTapSound } from "../hooks/useSounds";

type Dispatch = (action: Action) => void;

/**
 * Al alcanzar el límite del descanso el contador queda detenido y se espera
 * una decisión: "Siguiente" arranca el próximo trabajo, "Terminar" vuelve al
 * menú. No hay forma de alargar el descanso desde acá.
 *
 * Cuando está visible, TimerActions no renderiza sus botones para evitar
 * duplicar las acciones.
 */
export function BreakLimitDialog({
  state,
  dispatch,
  workMinutes,
}: {
  state: SessionState;
  dispatch: Dispatch;
  workMinutes: number;
}): JSX.Element | null {
  const playTapSound = useTapSound();

  if (state.kind !== "breakLimit") return null;

  return (
    <div className="limit-dialog" role="dialog" aria-modal="true">
      <div className="limit-dialog-panel">
        <p className="limit-dialog-title">Límite alcanzado</p>
        <p className="limit-dialog-body">
          Ya descansaste por mucho tiempo.
        </p>
        <div className="limit-dialog-actions">
          <button
            type="button"
            className="timer-btn"
            onClick={() => {
              playTapSound();
              dispatch({ type: "NEXT_WORK", workMin: workMinutes, at: Date.now() });
            }}
          >
            Siguiente
          </button>
          <button
            type="button"
            className="timer-btn"
            onClick={() => {
              playTapSound();
              dispatch({ type: "RESET" });
            }}
          >
            Terminar
          </button>
        </div>
      </div>
    </div>
  );
}