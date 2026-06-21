/**
 * Avante Design Tokens — Typography
 * Source: design/avante-tokens.css
 *
 * Fonts: Newsreader (serif/display) + Hanken Grotesk (sans/UI)
 * Note: Load these via expo-google-fonts or bundled assets before use.
 */

export const fontFamily = {
  serif: "Newsreader",       // display / editorial headings
  sans: "HankenGrotesk",    // UI text
  // Fallbacks handled at runtime by RN
} as const;

export const fontSize = {
  display: 31,   // saludo Inicio
  title: 28,     // título de pantalla
  h2: 24,        // subtítulos grandes
  h3: 21,        // títulos de tarjeta
  h4: 18,        // nombre de mundo
  bodyLg: 16,
  body: 15.5,
  bodySm: 14.5,
  label: 13,
  caption: 12.5,
  micro: 11,
  eyebrow: 10.5,
} as const;

export const fontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

export const letterSpacing = {
  eyebrow: 1.8,
  label: 1,
};
