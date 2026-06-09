// Tokens de tema centralizados — editá aquí para cambiar colores en toda la app
export const Colors = {
  // Fondos
  background:    '#F8F6F2',
  surface:       '#FFFFFF',
  surfaceAlt:    '#F8F6F2',

  // Texto
  textPrimary:   '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted:     '#AAAAAA',

  // Marca / Acento
  midnight:      '#1E2A4A',   // títulos, autoridad, enlaces
  primary:       '#C8553D',   // botón principal, terracota
  primaryLight:  '#F3ECE9',   // fondos sutiles de botones secondary

  // Áreas
  family:        '#E89B53',   // mandarina cálida
  work:          '#3D6B5F',   // verde profundo
  personal:      '#5B5193',   // índigo profundo

  // UI auxiliar
  border:        '#E8E5E0',
  borderLight:   '#EFEFEF',
  inputBg:       '#F8F6F2',
  error:         '#E05252',
  success:       '#4CAF50',
  successLight:  '#E8F5E9',
  divider:       '#EDE9E4',
  placeholder:   '#B0B0B0',
} as const;

export type ColorToken = keyof typeof Colors;
