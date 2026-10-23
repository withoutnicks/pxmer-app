mod session;
mod settings;

use std::sync::Arc;

use tauri::{AppHandle, Manager, RunEvent, State};
use tauri_plugin_notification::NotificationExt;

use session::{Action, Session, SessionState};
use settings::{Settings, SettingsStore};

pub const SESSION_STATE_EVENT: &str = "session-state";

/// Sends a native notification. Used by the automatic break-limit
/// notification owned by the timer.
pub(crate) fn notify(app: &AppHandle, title: &str, body: &str) {
    let _ = app
        .notification()
        .builder()
        .title(title)
        .body(body)
        .show();
}

#[tauri::command]
fn get_settings(store: State<'_, SettingsStore>) -> Settings {
    store.get()
}

#[tauri::command]
fn save_settings(store: State<'_, SettingsStore>, settings: Settings) {
    store.save(settings);
}

#[tauri::command]
fn session_start(app: AppHandle, session: State<'_, Arc<Session>>) -> SessionState {
    let session = Arc::clone(&session);
    session.start(&app);
    session.get_state()
}

#[tauri::command]
fn session_dispatch(
    app: AppHandle,
    session: State<'_, Arc<Session>>,
    action: Action,
) -> SessionState {
    let session = Arc::clone(&session);
    session.dispatch(&app, action);
    session.get_state()
}

/// Application entry point. The window itself is declared in
/// `tauri.conf.json`; this only wires plugins, state and IPC commands.
pub fn run() {
    let session = Arc::new(Session::new());

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            session_start,
            session_dispatch
        ])
        .build(tauri::generate_context!())
        .expect("error while building pxmer");

    app.manage(SettingsStore::new(app.handle()));
    app.manage(session.clone());

    app.run(move |_app, event| {
        if let RunEvent::Exit = event {
            session.stop();
        }
    });
}
