export type SessionState =
    | { kind: "idle" }
    | { kind: "work"; endsAt: number }
    | { kind: "workPaused"; remainingTime: number }
    | { kind: "break"; startedAt: number; limitMin: number }
    | { kind: "breakLimit"; limitMin: number }

export type Action =
    | { type: "START_WORK"; workMin: number; at: number }
    | { type: "PAUSE"; at: number }
    | { type: "RESUME"; at: number }
    | { type: "START_BREAK"; limitMin: number; at: number }
    | { type: "REACH_BREAK_LIMIT"; limitMin: number }
    | { type: "NEXT_WORK"; workMin: number; at: number }
    | { type: "RESET" }

export function sessionReducer(state: SessionState, action: Action): SessionState {
    if (action.type === "START_WORK" && state.kind === "idle") {
        return { kind: "work", endsAt: action.at + action.workMin * 60 * 1000 }
    }
    if (action.type === "PAUSE" && state.kind === "work") {
        return { kind: "workPaused", remainingTime: state.endsAt - action.at }
    }
    if (action.type === "RESUME" && state.kind === "workPaused") {
        return { kind: "work", endsAt: state.remainingTime + action.at }
    }
    if (action.type === "START_BREAK" && state.kind === "work") {
        return { kind: "break", startedAt: action.at, limitMin: action.limitMin }
    }
    if (action.type === "REACH_BREAK_LIMIT" && state.kind === "break") {
        return { kind: "breakLimit", limitMin: state.limitMin }
    }
    if (action.type === "NEXT_WORK" && (state.kind === "break" || state.kind === "breakLimit")) {
        return { kind: "work", endsAt: action.at + action.workMin * 60 * 1000 }
    }
    if (action.type === "RESET") {
        return { kind: "idle" }
    }

    return state
}