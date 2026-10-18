import { useEffect, useRef } from "react";
import type { Action, SessionState } from "@shared/session";
import { useTapSound } from "./useSounds";

type Dispatch = (action: Action) => void;

/**
 * Atajos de la sesión. Se escuchan en window porque la vista cambia entre
 * menú y temporizador, y no queremos atarlos a un elemento concreto.
 *
 * Espacio: pausa/reanuda, solo durante el trabajo. Durante el descanso y
 * en el límite no hace nada (decisión acordada: no se puede alargar el
 * descanso ni saltarse el límite con el teclado).
 * R: terminar la sesión y volver al menú.
 * W: terminar el descanso antes de tiempo e iniciar el siguiente trabajo.
 *
 * El estado y las duraciones van en refs: main reenvía el estado cada
 * segundo y eso crearía un listener nuevo en cada tick si los usáramos
 * como dependencias del efecto.
 */
export function useSessionKeys({
  state,
  dispatch,
  workMinutes,
}: {
  state: SessionState;
  dispatch: Dispatch;
  workMinutes: number;
}): void {
  const playTapSound = useTapSound();

  const stateRef = useRef(state);
  const dispatchRef = useRef(dispatch);
  const workRef = useRef(workMinutes);

  stateRef.current = state;
  dispatchRef.current = dispatch;
  workRef.current = workMinutes;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      // Si estás escribiendo en un campo, las teclas son del campo.
      if (event.target instanceof HTMLInputElement) return;

      const current = stateRef.current;
      playTapSound();

      if (event.code === "Space") {
        // Evita scroll y evita que Space active el botón que tenga el foco.
        event.preventDefault();
        if (current.kind === "work") {
          dispatchRef.current({ type: "PAUSE", at: Date.now() });
        } else if (current.kind === "workPaused") {
          dispatchRef.current({ type: "RESUME", at: Date.now() });
        }
        return;
      }

      if (event.key.toLowerCase() === "r") {
        dispatchRef.current({ type: "RESET" });
        return;
      }

      if (event.key.toLowerCase() === "w") {
        if (current.kind === "break" || current.kind === "breakLimit") {
          dispatchRef.current({
            type: "NEXT_WORK",
            workMin: workRef.current,
            at: Date.now(),
          });
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}