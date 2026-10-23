use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};
use std::thread;
use std::time::{Duration, SystemTime};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};

use crate::settings;
use crate::{notify, SESSION_STATE_EVENT};

/// Milliseconds per minute. Kept as a constant so the timer math reads like
/// the original TS code.
pub const MINUTE_MS: i64 = 60_000;

/// Timer state. Serialized with the same wire shape as the old TS
/// `SessionState` (internally tagged by `kind`, camelCase fields) so the
/// renderer keep working untouched.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum SessionState {
    Idle,
    #[serde(rename_all = "camelCase")]
    Work { ends_at: i64 },
    #[serde(rename_all = "camelCase")]
    WorkPaused { remaining_time: i64 },
    #[serde(rename_all = "camelCase")]
    Break { started_at: i64, limit_min: i64 },
    #[serde(rename_all = "camelCase")]
    BreakLimit { limit_min: i64 },
}

/// Actions the renderer sends. Same wire shape as the TS `Action` union.
#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(tag = "type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Action {
    #[serde(rename_all = "camelCase")]
    StartWork { work_min: i64, at: i64 },
    #[serde(rename_all = "camelCase")]
    Pause { at: i64 },
    #[serde(rename_all = "camelCase")]
    Resume { at: i64 },
    #[serde(rename_all = "camelCase")]
    StartBreak { limit_min: i64, at: i64 },
    #[serde(rename_all = "camelCase")]
    ReachBreakLimit {
        /// Present for wire parity with the TS action; the reducer uses the
        /// limit stored in the state instead.
        #[allow(dead_code)]
        limit_min: i64,
    },
    #[serde(rename_all = "camelCase")]
    NextWork { work_min: i64, at: i64 },
    Reset,
}

/// Pure reducer, mirroring `src/shared/session.ts`. Returns `None` when the
/// action does not apply to the current state, preserving the old "same state
/// instance" semantics of the TS reducer.
pub fn reduce(state: &SessionState, action: &Action) -> Option<SessionState> {
    match (state, action) {
        (SessionState::Idle, Action::StartWork { work_min, at }) => Some(SessionState::Work {
            ends_at: *at + *work_min * MINUTE_MS,
        }),
        (SessionState::Work { ends_at }, Action::Pause { at }) => {
            Some(SessionState::WorkPaused {
                remaining_time: *ends_at - *at,
            })
        }
        (SessionState::WorkPaused { remaining_time }, Action::Resume { at }) => {
            Some(SessionState::Work {
                ends_at: *remaining_time + *at,
            })
        }
        (SessionState::Work { .. }, Action::StartBreak { limit_min, at }) => {
            Some(SessionState::Break {
                started_at: *at,
                limit_min: *limit_min,
            })
        }
        // The break limit comes from the state, not from the action.
        (SessionState::Break { limit_min, .. }, Action::ReachBreakLimit { .. }) => {
            Some(SessionState::BreakLimit {
                limit_min: *limit_min,
            })
        }
        (
            SessionState::Break { .. } | SessionState::BreakLimit { .. },
            Action::NextWork { work_min, at },
        ) => Some(SessionState::Work {
            ends_at: *at + *work_min * MINUTE_MS,
        }),
        (_, Action::Reset) => Some(SessionState::Idle),
        _ => None,
    }
}

/// Decides whether the elapsed time requires an automatic transition.
/// Kept outside the reducer on purpose: the reducer is pure and does not know
/// the clock, so the ticker passes the current time in. Because it compares
/// timestamps instead of accumulated intervals, a suspended or minimized app
/// still transitions correctly on the next tick.
pub fn automatic_action(state: &SessionState, now: i64, break_limit: i64) -> Option<Action> {
    match state {
        SessionState::Work { ends_at } if now >= *ends_at => Some(Action::StartBreak {
            limit_min: break_limit,
            at: now,
        }),
        // A running break keeps the limit captured when it started, so editing
        // settings mid-break cannot move its endpoint (and the ticker needs no
        // disk read to check it).
        SessionState::Break {
            started_at,
            limit_min,
        } if now >= *started_at + *limit_min * MINUTE_MS => Some(Action::ReachBreakLimit {
            limit_min: *limit_min,
        }),
        _ => None,
    }
}

struct Core {
    state: SessionState,
    ticking: bool,
    break_limit_notified: bool,
}

/// Owns the clock, mirroring the Electron `SessionController`: a single owner
/// of the timer that pushes state to the renderer through events.
pub struct Session {
    core: Mutex<Core>,
    exiting: AtomicBool,
}

impl Session {
    pub fn new() -> Self {
        Self {
            core: Mutex::new(Core {
                state: SessionState::Idle,
                ticking: false,
                break_limit_notified: false,
            }),
            exiting: AtomicBool::new(false),
        }
    }

    pub fn get_state(&self) -> SessionState {
        self.lock().state.clone()
    }

    /// Starts the one-second ticker. Idempotent: subsequent calls only re-emit
    /// the current state, like the Electron controller does.
    pub fn start(self: &Arc<Self>, app: &AppHandle) {
        if self.lock().ticking {
            let state = self.get_state();
            let _ = app.emit(SESSION_STATE_EVENT, state);
            return;
        }
        self.lock().ticking = true;
        let session = Arc::clone(self);
        let app = app.clone();
        thread::spawn(move || session.tick_loop(&app));
    }

    pub fn dispatch(&self, app: &AppHandle, action: Action) {
        let next = reduce(&self.lock().state, &action);
        self.apply(app, next);
    }

    /// Stops the ticker. Called when the app is about to exit.
    pub fn stop(&self) {
        self.exiting.store(true, Ordering::Relaxed);
        self.lock().ticking = false;
    }

    fn tick_loop(self: &Arc<Self>, app: &AppHandle) {
        loop {
            if self.exiting.load(Ordering::Relaxed) {
                break;
            }
            if !self.lock().ticking {
                break;
            }
            self.tick(app);
            thread::sleep(Duration::from_secs(1));
        }
    }

    fn tick(&self, app: &AppHandle) {
        let now = now_ms();
        // Cached in memory: the ticker never reads the settings file.
        let break_limit = i64::from(app.state::<settings::SettingsStore>().get().break_limit);
        let next = {
            let core = self.lock();
            automatic_action(&core.state, now, break_limit)
                .and_then(|action| reduce(&core.state, &action))
        };
        match next {
            Some(state) => self.apply(app, Some(state)),
            // No phase change: the renderer only needs to repaint the clock.
            None => {
                let state = self.get_state();
                let _ = app.emit(SESSION_STATE_EVENT, state);
            }
        }
    }

    /// Stores the new state, notifies the renderer, and raises the break-limit
    /// notification exactly once per break.
    fn apply(&self, app: &AppHandle, next: Option<SessionState>) {
        let Some(next) = next else { return };
        let should_notify = {
            let mut core = self.lock();
            if next == core.state {
                return;
            }
            let entered_break_limit = matches!(next, SessionState::BreakLimit { .. })
                && !matches!(core.state, SessionState::BreakLimit { .. });
            core.state = next.clone();
            // Leaving the break limit re-arms the notification for the next
            // break, same as the TS controller.
            if !matches!(next, SessionState::BreakLimit { .. }) {
                core.break_limit_notified = false;
            }
            let should_notify = entered_break_limit && !core.break_limit_notified;
            if should_notify {
                core.break_limit_notified = true;
            }
            should_notify
        };
        let _ = app.emit(SESSION_STATE_EVENT, next);
        if should_notify {
            notify(app, "PXmer", "Alcanzaste el límite del descanso.");
        }
    }

    fn lock(&self) -> MutexGuard<'_, Core> {
        self.core.lock().unwrap()
    }
}

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|elapsed| elapsed.as_millis() as i64)
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn work_pause_resume_keeps_remaining_time() {
        let work = reduce(
            &SessionState::Idle,
            &Action::StartWork {
                work_min: 25,
                at: 1_000,
            },
        )
        .unwrap();
        assert_eq!(
            work,
            SessionState::Work {
                ends_at: 1_000 + 25 * MINUTE_MS
            }
        );

        let paused = reduce(&work, &Action::Pause { at: 500_000 }).unwrap();
        assert_eq!(
            paused,
            SessionState::WorkPaused {
                remaining_time: 25 * MINUTE_MS - 499_000
            }
        );

        let resumed = reduce(&paused, &Action::Resume { at: 600_000 }).unwrap();
        assert_eq!(
            resumed,
            SessionState::Work {
                ends_at: 600_000 + (25 * MINUTE_MS - 499_000)
            }
        );
    }

    #[test]
    fn time_reaching_end_starts_break() {
        let work = SessionState::Work { ends_at: 10_000 };
        assert_eq!(
            automatic_action(&work, 10_000, 10),
            Some(Action::StartBreak {
                limit_min: 10,
                at: 10_000
            })
        );
        assert_eq!(automatic_action(&work, 9_999, 10), None);
    }

    #[test]
    fn break_limit_is_reached_after_limit_minutes() {
        let brk = SessionState::Break {
            started_at: 0,
            limit_min: 10,
        };
        assert_eq!(
            automatic_action(&brk, 10 * MINUTE_MS, 10),
            Some(Action::ReachBreakLimit { limit_min: 10 })
        );
        assert_eq!(automatic_action(&brk, 10 * MINUTE_MS - 1, 10), None);
    }

    #[test]
    fn running_break_ignores_later_settings_changes() {
        let brk = SessionState::Break {
            started_at: 0,
            limit_min: 10,
        };
        // A different live setting must not move the endpoint of a running break.
        assert_eq!(automatic_action(&brk, 10 * MINUTE_MS - 1, 20), None);
        assert_eq!(
            automatic_action(&brk, 10 * MINUTE_MS, 20),
            Some(Action::ReachBreakLimit { limit_min: 10 })
        );
    }

    #[test]
    fn next_work_only_from_break_states() {
        let break_limit = SessionState::BreakLimit { limit_min: 10 };
        assert_eq!(
            reduce(
                &break_limit,
                &Action::NextWork {
                    work_min: 25,
                    at: 0
                }
            ),
            Some(SessionState::Work {
                ends_at: 25 * MINUTE_MS
            })
        );
        assert_eq!(
            reduce(
                &SessionState::Work { ends_at: 0 },
                &Action::NextWork {
                    work_min: 25,
                    at: 0
                }
            ),
            None
        );
    }

    #[test]
    fn reset_from_any_state() {
        let paused = SessionState::WorkPaused {
            remaining_time: 1_000,
        };
        assert_eq!(reduce(&paused, &Action::Reset), Some(SessionState::Idle));
    }

    #[test]
    fn wire_format_matches_ts_contract() {
        let work = serde_json::to_value(SessionState::Work { ends_at: 42 }).unwrap();
        assert_eq!(work, serde_json::json!({ "kind": "work", "endsAt": 42 }));

        let action = serde_json::from_value::<Action>(serde_json::json!({
            "type": "START_WORK",
            "workMin": 25,
            "at": 7
        }))
        .unwrap();
        assert_eq!(
            action,
            Action::StartWork {
                work_min: 25,
                at: 7
            }
        );
    }
}
