import type { JSX } from "react";
import type { SessionState } from "@shared/session";
import { formatMs } from "../utils/format";

export const STATE_LABEL: Record<SessionState["kind"], string> = {
  idle: "En el menú",
  work: "Trabajando",
  workPaused: "Trabajo pausado",
  break: "Descansando",
  breakLimit: "Límite de descanso alcanzado",
};

/** El número grande. En "work" falta para llegar a cero. */
export function clockText(state: SessionState): string {
  const now = Date.now();
  switch (state.kind) {
    case "idle":
      return "--:--";
    case "work":
      return formatMs(state.endsAt - now);
    case "workPaused":
      return formatMs(state.remainingTime);
    case "break":
      return formatMs(now - state.startedAt);
    case "breakLimit":
      return formatMs(state.limitMin * 60_000);
  }
}

export function TimerClock({ state }: { state: SessionState }): JSX.Element {
  return (
    <header className="timer-header">
      <p className={`timer-kind ${state.kind === "work" ? "work" : state.kind === "workPaused" ? "paused" : state.kind === "breakLimit" ? "limit" : ""}`}>
        {STATE_LABEL[state.kind]}
      </p>
      <p className="timer-clock">{clockText(state)}</p>
    </header>
  );
}