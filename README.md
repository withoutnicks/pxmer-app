# PXmer

Aplicación de escritorio de temporizador Pomodoro con estética oscura de terminal, inspirada visualmente en [Tuime](https://github.com/nthnd/tuime). Sin backend, sin cuentas. Construida con **Tauri 2 + React + TypeScript**.

## Requisitos

- Node.js y pnpm
- Rust con toolchain MSVC (`rustup`, `cargo`) — el build de Windows se compila desde Windows
- WebView2 (preinstalado en Windows 10/11)

## Instalación y desarrollo

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

## Generar el instalador

```bash
pnpm tauri build
```

El resultado es **`src-tauri/target/release/bundle/nsis/pxmer_1.0.0_x64-setup.exe`**: un instalador ligero (unos pocos MB) que usa el WebView2 del sistema en lugar de empaquetar un navegador completo.

Para publicarlo en un Release de GitHub: pestaña **Releases** → **Draft a new release** → adjuntar el `.exe` como asset.

## Nota sobre el ícono

El ícono vive en `src-tauri/icons/icon.ico` (multi-tamaño, incluye 256×256 px). Si necesitas regenerar el set completo, usa `pnpm tauri icon <origen.png>` con una imagen cuadrada de al menos 1024×1024 px.

## Atajos de teclado (con la app enfocada)

| Tecla | Acción |
|-------|--------|
| `Espacio` | Iniciar / pausar / reanudar (solo durante el trabajo) |
| `R` | Terminar la sesión y volver al menú |
| `W` | Terminar el descanso anticipadamente e iniciar el siguiente trabajo |

Durante el descanso o en el popup de límite, `Espacio` no hace nada (el descanso no es pausable).

## Ciclo

- **Trabajo:** cuenta regresiva (25 min por defecto, rango 5–90 min), pausable.
- **Descanso:** cuenta ascendente, arranca automático (límite 10 min por defecto, rango 1–20 min). Al llegar al límite aparece un popup con **Siguiente** / **Terminar** y notificación de escritorio.

Los ajustes se configuran antes de iniciar y quedan fijos durante la sesión; los cambios se aplican en la siguiente.
Se guardan en `settings.json` dentro de `%APPDATA%\com.pxmer.app\`, junto con la preferencia de tema (oscuro por defecto).

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
