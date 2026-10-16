export type Theme = 'dark' | 'light'

export interface Settings {
  workMinutes: number
  breakLimit: number
  theme: Theme
}

export const DEFAULT_SETTINGS: Settings = {
  workMinutes: 25,
  breakLimit: 10,
  theme: 'dark'
}
