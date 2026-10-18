// Los atributos min/max del input no impiden escribir: solo afectan al
// stepper y a la validación del formulario. Por eso el rango se chequea
// aparte para no dejar pasar una sesión imposible de iniciar.
export const WORK_RANGE = { min: 5, max: 90 } as const;
export const BREAK_RANGE = { min: 1, max: 20 } as const;

export function isInRange(
  value: number,
  range: { min: number; max: number }
): boolean {
  return value >= range.min && value <= range.max;
}
