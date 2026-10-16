# PXmer: plan del proyecto

Documento de referencia para cualquier persona o agente que continúe el trabajo. Las casillas se marcan al completar y revisar cada etapa.

## Resumen

PXmer es una aplicación de escritorio de temporizador Pomodoro con estética oscura de terminal. Se inspira visualmente en [Tuime](https://github.com/nthnd/tuime), sin copiarlo. Sin backend, sin cuentas e sin integraciones de música.

## Decisiones acordadas

- **Plataforma objetivo inicial:** Windows. Evitar decisiones que bloqueen otros sistemas, sin invertir esfuerzo en ellos todavía.
- **Stack:** Electron + TypeScript + React + Vite. Gestor de paquetes: pnpm (ya fijado en `package.json`).
- **Seguridad de Electron:** `contextIsolation` activado, sin `nodeIntegration` en el renderer, y una API pequeña y explícita expuesta desde el preload.
- **Pantalla principal:** menú de configuración. Desde ahí se inicia el trabajo. Al cerrar y reabrir la app, se vuelve a este menú conservando los ajustes.
- **Ciclo de trabajo:** cuenta regresiva. Duración inicial de **25 min**, ajustable entre **5 y 90 min**.
- **Descanso:** cuenta ascendente que comienza automáticamente al terminar el trabajo. Límite de seguridad inicial de **10 min**, ajustable entre **1 y 20 min**.
- **Ajustes:** las dos duraciones se configuran antes de iniciar una sesión y quedan fijas durante toda ella. Los cambios se aplican en la siguiente sesión.
- **Pausa del trabajo:** sí, se puede pausar y reanudar. El tiempo pausado no cuenta.
- **Pausa del descanso:** no; el descanso corre sin poder pausarse.
- **Fin del descanso:** la persona puede terminarlo antes con `W`, que inicia el siguiente trabajo de inmediato.
- **Límite del descanso:** al alcanzarlo, el contador se detiene en ese valor. Aparece un popup con dos acciones:
  - **Siguiente**: inicia el próximo trabajo de 25 min (o la duración configurada).
  - **Terminar**: vuelve al menú de configuración.
  - `Espacio` no tiene efecto durante el descanso ni en el popup del límite.
- **Tiempo correcto:** el cálculo se hace con marcas de tiempo en el proceso principal, no sumando intervalos de la interfaz. Debe seguir siendo correcto al minimizar o suspender la ventana.
- **Avisos:** en la app y con notificación de escritorio al alcanzar el límite del descanso. Al terminar el trabajo, la interfaz cambia automáticamente a descanso (sin notificación de escritorio en esa transición).
- **Persistencia:** las dos duraciones y el tema se guardan en un JSON local gestionado por el proceso principal, en la carpeta de datos de la app. Al cerrar no se guarda la sesión; al abrir, queda en el menú con los últimos ajustes.
- **Atajos (con la app enfocada):**
  - `Espacio`: iniciar / pausar / reanudar (solo durante el trabajo).
  - `R`: termina la sesión y vuelve al menú de configuración.
  - `W`: termina el descanso anticipadamente e inicia el siguiente trabajo.
- **Interfaz:** oscura por defecto, monoespaciada o pixelada, con el tiempo como elemento principal y acciones visibles. Incluye un alternador de tema claro/oscuro.
- **Idioma:** la interfaz se muestra en español.

## Fuera de alcance (primera versión)

- Integraciones de música (incluido YouTube Music).
- Cuentas, sincronización o backend.
- Restaurar una sesión en curso al reabrir la app.
- Atajos globales fuera de la ventana.
- Empaquetado e instaladores (se definirá más adelante).
- Pausar el descanso.
- Extender el descanso más allá del límite.
- Alternar idioma o internacionalización de la interfaz.

## Arquitectura

- **Proceso principal:** gestiona el temporizador con marcas de tiempo, detecta los límites y envía el estado al renderer mediante IPC. Envía la notificación de escritorio cuando se alcanza el límite del descanso.
- **Preload:** expone una API pequeña y explícita (`start`, `pause`, `resume`, `stop`, `getState`, `onStateChange`, `getSettings`, `saveSettings`). No expone Node.js directamente al renderer.
- **Renderer (React):** recibe el estado y lo muestra. No calcula tiempo por su cuenta. Muestra el popup de decisión al llegar al límite.
- **Tipos compartidos:** `src/shared/settings.ts` define `Theme`, `Settings` y `DEFAULT_SETTINGS`. Lo importan el proceso principal, el preload y el renderer. Ningún tipo de ajustes se redeclara en otro archivo.
- **Estado de ajustes en el renderer:** un único `useState<Settings | null>` en `App.tsx`. El `null` inicial representa "aún no cargado" y muestra la pantalla de carga.
- **Preferencias:** JSON local en la carpeta de datos de la app, leído y escrito solo por el proceso principal. La validación de rangos ocurre solo al escribir; al leer se confía en lo guardado, con valores por defecto como respaldo.

## Etapas

### Etapa 1: base del proyecto

- [x] Migrar el esqueleto actual (`index.html`, `index.js`) a Electron + TypeScript + React + Vite.
- [x] Configurar el proceso principal, el preload y el renderer por separado.
- [x] Activar `contextIsolation` y verificar que Node.js no está expuesto al renderer.
- [x] Crear la estructura de archivos según la arquitectura definida.
- [x] Verificar que la app arranca en Windows con `pnpm dev` (o el script equivalente).

**Criterio de terminado:** la ventana abre con una pantalla React mínima y el renderer no tiene acceso directo a Node.js.

### Etapa 2: lógica del temporizador

- [ ] Modelar los estados: `idle` (menú), `work`, `workPaused`, `break`, `breakLimit`.
- [ ] Implementar el cálculo de tiempo transcurrido a partir de marcas de tiempo en el proceso principal.
- [ ] Transición automática de trabajo a descanso al llegar a cero.
- [ ] Detección y aviso al alcanzar el límite del descanso; el contador se detiene.
- [ ] Permitir pausa/reanudación solo durante el trabajo.
- [ ] Implementar `W`: terminar descanso anticipadamente e iniciar el siguiente trabajo.
- [ ] Implementar `R`: terminar sesión y volver al menú.
- [ ] Implementar el popup del límite con `Siguiente` y `Terminar`.
- [ ] Aplicar cambios de duración solo a la siguiente sesión.

**Criterio de terminado:** pruebas para todas las transiciones de estado, para el cálculo con marcas de tiempo (incluido simulando suspensión o minimización) y para los comandos del popup.

### Etapa 3: interfaz y ajustes

- [ ] Menú de configuración como pantalla principal: campos para duración del trabajo (5–90 min) y límite del descanso (1–20 min).
- [x] Traducir la interfaz al español.
- [x] Alternador de tema claro/oscuro, con la preferencia guardada en `settings.json`.
- [x] Iconos de interfaz en `src/renderer/src/components/Icons.tsx`, con nombre accesible en el botón y SVG decorativo.
- [x] Estados de foco visibles (`:focus-visible`) en botones y campos.
- [ ] Pantalla de temporizador: tiempo en formato monoespaciado o pixelado, fase y estado visibles.
- [ ] Botones: Iniciar, Pausar/Reanudar (durante trabajo), Terminar sesión (`R`).
- [ ] Popup de decisión al alcanzar el límite del descanso: `Siguiente` y `Terminar`.
- [ ] Estilo oscuro propio en CSS, sin copiar Tuime.

**Criterio de terminado:** todas las acciones son alcanzables con el ratón y los ajustes sobreviven a reiniciar la app.

### Etapa 4: avisos, atajos y pruebas finales

- [ ] Notificación de escritorio al alcanzar el límite del descanso.
- [ ] Verificar el flujo completo: trabajo → descanso → límite → popup → decisión.
- [ ] Verificar que `Espacio` no tiene efecto durante el descanso ni en el popup.
- [ ] Verificar que el tiempo sigue siendo correcto con la ventana minimizada.
- [ ] Verificar que al cerrar y abrir vuelve al menú con los últimos ajustes.
- [ ] Anotar qué quedó pendiente para una siguiente versión.

**Criterio de terminado:** el flujo completo funciona en Windows, con el tiempo correcto y el aviso llegando también con la ventana minimizada.

## Registro de cambios

- **2025-XX-XX** — Plan inicial definido a partir del esqueleto Electron existente. Decisiones tomadas en modo pair programming: pantalla principal como menú de configuración, trabajo pausable pero descanso sin pausa, popup en el límite con Siguiente/Terminar, preferencias en JSON local, lógica de temporizador en el proceso principal.
- **2026-10-15** — Base del proyecto montada (Electron + TypeScript + React + Vite, preload aislado). Interfaz del menú traducida al español, botón de idioma retirado, alternador de tema claro/oscuro con preferencia guardada en `settings.json`, iconos extraídos a `components/Icons.tsx` con patrón accesible y estados `:focus-visible` añadidos. `tsconfig.node.json` corregido para permitir el chequeo de tipos.
- **2026-10-16** — Fuente única de tipos en `src/shared/settings.ts`; menú con un solo estado de ajustes; limpieza de los intentos `SettingsContext` y `ToggleTheme`; `loadSettings` simplificado (la validación de rangos queda solo al escribir). Primer commit del proyecto.
