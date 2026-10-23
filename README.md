# 🚥 PXmer

Aplicación de escritorio de temporizador Pomodoro con estética oscura de terminal, inspirada visualmente en [Tuime](https://github.com/nthnd/tuime).

## Requisitos

- Node.js y pnpm
- Rust con toolchain MSVC (`rustup`, `cargo`)
- WebView2 (preinstalado en Windows 10/11)

## Instalación

```bash
pnpm install
pnpm tauri dev
```

## Scripts

| Script | Descripción |
|--------|-------------|
| `pnpm tauri dev` | App completa en desarrollo con recarga del renderer |
| `pnpm tauri build` | Compila el backend y genera el instalador NSIS |
| `pnpm dev` | Solo el servidor Vite del renderer (sin shell Tauri) |
| `pnpm build` | Solo el build del renderer en `dist-web/` |

## Build

```bash
pnpm tauri build
```

El instalador NSIS queda en `src-tauri/target/release/bundle/nsis/` (unos 2 MB). Usa el WebView2 del sistema, no empaqueta un navegador.

## Atajos de teclado

| Tecla | Acción |
|-------|--------|
| `Espacio` | Iniciar / pausar / reanudar (solo durante el trabajo) |
| `R` | Terminar la sesión y volver al menú |
| `W` | Terminar el descanso anticipadamente e iniciar el siguiente trabajo |

Durante el descanso o en el popup de límite, `Espacio` no hace nada.

## Ciclo

- **Trabajo:** cuenta regresiva (25 min por defecto), pausable.
- **Descanso:** cuenta ascendente, arranca automático (límite 10 min por defecto).

Los ajustes se guardan en `settings.json` dentro de `%APPDATA%\com.pxmer.app\`, junto con la preferencia de tema (oscuro por defecto).

## Estructura

```
src-tauri/      # Backend Rust: reloj, reducer, persistencia, IPC y ventana
└── src/
    ├── session.rs   # Máquina de estados del temporizador + ticker
    ├── settings.rs  # Persistencia de ajustes
    └── lib.rs       # Commands IPC y arranque
src/
├── renderer/   # UI en React + Vite (api.ts implementa el puente IPC)
└── shared/     # Tipos compartidos (settings, session) y reducer puro
```
