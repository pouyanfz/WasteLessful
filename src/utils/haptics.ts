const PATTERNS: Record<string, VibratePattern> = {
  light: 10,
  medium: 25,
  heavy: [40, 30, 40],
}

export function haptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  navigator.vibrate?.(PATTERNS[type])
}
