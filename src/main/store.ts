import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { DEFAULT_SETTINGS, type Settings } from '../shared/settings'

function getSettingsPath(): string {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'settings.json')
}

export function loadSettings(): Settings {
  const path = getSettingsPath()
  if (!existsSync(path)) {
    return DEFAULT_SETTINGS
  }
  try {
    const raw = readFileSync(path, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      workMinutes: parsed.workMinutes ?? DEFAULT_SETTINGS.workMinutes,
      breakLimit: parsed.breakLimit ?? DEFAULT_SETTINGS.breakLimit,
      theme: parsed.theme === 'light' ? 'light' : 'dark'
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): void {
  const path = getSettingsPath()
  const dir = join(app.getPath('userData'))
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const validated: Settings = {
    workMinutes: clamp(settings.workMinutes, 5, 90),
    breakLimit: clamp(settings.breakLimit, 1, 20),
    theme: settings.theme === 'light' ? 'light' : 'dark'
  }
  writeFileSync(path, JSON.stringify(validated, null, 2), 'utf-8')
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
