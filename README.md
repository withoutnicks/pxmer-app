# PXmer

Aplicación de escritorio de temporizador Pomodoro con estética oscura de terminal, inspirada visualmente en [Tuime](https://github.com/nthnd/tuime). Sin backend, sin cuentas.

## Requisitos

- Node.js
- pnpm

## Instalación y desarrollo

```bash
pnpm install
pnpm dev
```

## Scripts

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Modo desarrollo con recarga |
| `pnpm build` | Build de producción (main, preload, renderer) |
| `pnpm start` | Ejecuta el build (`out/`) sin recarga |
| `pnpm dist` | Genera el portable en `dist/` (requiere `pnpm build` previo) |
| `pnpm dist:win` | Build + portable de Windows en un solo paso |

## Generar el ejecutable

```bash
pnpm build
pnpm dist
```

El resultado es **`dist/PXmer 1.0.0.exe`** — un `.exe` portable autocontenido (no requiere instalación).

Para publicarlo en un Release de GitHub: pestaña **Releases** → **Draft a new release** → adjuntar solo el `.exe` como asset.

## Nota sobre el ícono

El ícono (`resources/icon.ico`) debe tener al menos una entrada de **256×256 px**; electron-builder rechaza `.ico` de menor resolución.

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
Se guardan en `settings.json` junto con la preferencia de tema (oscuro por defecto).

## Estructura

```
src/
├── main/       # Proceso principal: temporizador, IPC, persistencia
├── preload/    # Puente seguro (contextBridge) renderer ↔ main
├── shared/     # Tipos compartidos (settings, session) y reducer puro
└── renderer/   # UI en React + Vite
```
