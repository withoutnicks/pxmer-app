import { sessionReducer, type Action, type SessionState } from '../shared/session'

export interface SessionDeps {
  getWorkMinutes: () => number
  getBreakLimit: () => number
  onChange: (state: SessionState) => void
  onBreakLimit: () => void
}

const MINUTE = 60_000

/**
 * Decide si el paso del tiempo exige una transición automática.
 * Se mantiene fuera del reducer a propósito: el reducer es puro y no
 * conoce el reloj, así que main le pasa la hora ya calculada.
 */
function automaticAction(
  state: SessionState,
  now: number,
  breakLimit: number
): Action | null {
  if (state.kind === 'work' && now >= state.endsAt) {
    return { type: 'START_BREAK', limitMin: breakLimit, at: now }
  }
  if (state.kind === 'break' && now >= state.startedAt + breakLimit * MINUTE) {
    return { type: 'REACH_BREAK_LIMIT', limitMin: breakLimit }
  }
  return null
}

export class SessionController {
  private state: SessionState = { kind: 'idle' }
  private timer: NodeJS.Timeout | null = null
  private breakLimitNotified = false

  constructor(private deps: SessionDeps) {}

  getState(): SessionState {
    return this.state
  }

  dispatch(action: Action): void {
    this.apply(sessionReducer(this.state, action))
  }

  start(): void {
    if (this.timer) return
    this.timer = setInterval(() => this.tick(), 1000)
    this.deps.onChange(this.state)
  }

  stop(): void {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = null
  }

  private tick(): void {
    const now = Date.now()
    const action = automaticAction(this.state, now, this.deps.getBreakLimit())
    if (action) {
      this.apply(sessionReducer(this.state, action))
      return
    }
    // Sin cambio de fase, el renderer solo necesita repintar el reloj.
    this.deps.onChange(this.state)
  }

  /** Guarda el estado nuevo, avisa al renderer y notifica el límite una sola vez. */
  private apply(next: SessionState): void {
    if (next === this.state) return
    const enteredBreakLimit = next.kind === 'breakLimit' && this.state.kind !== 'breakLimit'
    this.state = next
    this.deps.onChange(next)
    if (enteredBreakLimit && !this.breakLimitNotified) {
      this.breakLimitNotified = true
      this.deps.onBreakLimit()
    }
    if (next.kind !== 'breakLimit') this.breakLimitNotified = false
  }
}