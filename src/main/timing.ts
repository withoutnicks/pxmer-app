import type { Action, SessionState } from '../shared/session'

export const MINUTE = 60_000

/**
 * Decide si el paso del tiempo exige una transición automática.
 * Se mantiene fuera del reducer a propósito: el reducer es puro y no
 * conoce el reloj, así que main le pasa la hora ya calculada.
 *
 * `now` es la marca de tiempo actual. Si la app estuvo suspendida o
 * minimizada, `now` saltó hacia adelante: la transición se dispara igual
 * porque se comparan marcas, no intervalos acumulados.
 */
export function automaticAction(
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
