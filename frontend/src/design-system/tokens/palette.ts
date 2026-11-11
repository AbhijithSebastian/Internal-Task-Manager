/**
 * Literal palette values for the few places where a CSS custom property
 * cannot be used:
 *
 *   · native `<input type="color">` values
 *   · string concatenation for alpha tints (`${hex}20`)
 *   · canvas / SVG attributes that are not styled by CSS
 *
 * Everywhere else use the semantic tokens from `semantic.css`.
 * Keep this file in sync with `primitives.css`.
 */

export const palette = {
  white: "#ffffff",
  black: "#000000",

  grey50: "#f5f5f5",
  grey100: "#ececec",
  grey200: "#d8d8d8",
  grey500: "#9e9e9e",
  grey900: "#202020",

  primary100: "#e7f0fd",
  primary600: "#6ca3ef",
  primary1000: "#0a65e4",

  secondary700: "#5b5772",
  secondary800: "#433f5e",
  secondary1000: "#140f36",

  success600: "#12b76a",
  success700: "#039855",
  success800: "#027a48",

  warning600: "#f79009",
  warning800: "#b54708",

  error600: "#f04438",
  error700: "#d92d20",
  error800: "#b42318",
} as const;

/** Accent applied to roles that have no colour of their own. */
export const DEFAULT_ROLE_COLOR: string = palette.primary1000;

/** Accent applied to the first colour option in pickers. */
export const ACCENT_COLORS = [
  palette.primary1000,
  palette.primary600,
  palette.success700,
  palette.warning600,
  palette.error700,
  palette.secondary700,
] as const;
