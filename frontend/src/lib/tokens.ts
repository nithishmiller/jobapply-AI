/**
 * TypeScript token exports for JavaScript logic and Framer Motion.
 * Mirrors CSS custom properties from primitives.css and semantic.css
 */

// Color primitives (OKLCH)
export const colorPrimitives = {
  neutral: {
    950: "oklch(0.145 0 0)",
    900: "oklch(0.205 0 0)",
    800: "oklch(0.269 0 0)",
    400: "oklch(0.708 0 0)",
    0: "oklch(1 0 0)",
  },
  cyan: {
    500: "oklch(0.68 0.2 195)",
    400: "oklch(0.75 0.18 195)",
  },
  blue: {
    500: "oklch(0.58 0.18 255)",
  },
  glow: {
    cyan: "oklch(0.75 0.2 195 / 0.4)",
  },
} as const;

// Semantic color mappings
export const semanticColors = {
  primary: colorPrimitives.cyan[500],
  primaryHover: colorPrimitives.cyan[400],
  secondary: colorPrimitives.blue[500],
  glow: colorPrimitives.glow.cyan,

  surface: {
    0: colorPrimitives.neutral[950],
    1: colorPrimitives.neutral[900],
    2: colorPrimitives.neutral[800],
    3: colorPrimitives.neutral[800],
    4: colorPrimitives.neutral[950],
  },
} as const;

// Typography
export const fonts = {
  display: '"Space Grotesk Variable", sans-serif',
  body: '"DM Sans Variable", sans-serif',
  mono: '"JetBrains Mono Variable", monospace',
} as const;

export const fontSizes = {
  h1: { size: "clamp(3.5rem, 8vw, 6rem)", weight: 700, lineHeight: "tight", letterSpacing: "-0.02em" },
  h2: { size: "clamp(2.5rem, 6vw, 4rem)", weight: 600, lineHeight: "tight", letterSpacing: "-0.02em" },
  h3: { size: "clamp(1.5rem, 3vw, 2rem)", weight: 600, lineHeight: 1.25, letterSpacing: "0" },
  bodyLg: { size: "clamp(1.125rem, 2vw, 1.25rem)", weight: 400, lineHeight: 1.625, letterSpacing: "0" },
  body: { size: "clamp(1rem, 1.5vw, 1.125rem)", weight: 400, lineHeight: 1.5, letterSpacing: "0" },
  label: { size: "clamp(0.875rem, 1vw, 1rem)", weight: 500, lineHeight: 1.5, letterSpacing: "0.02em" },
  caption: { size: "clamp(0.75rem, 1vw, 0.875rem)", weight: 400, lineHeight: 1.5, letterSpacing: "0.02em" },
  code: { size: "0.875rem", weight: 400, lineHeight: 1.5, letterSpacing: "0" },
} as const;

// Spacing (4px base)
export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  12: "48px",
  section: "clamp(48px, 10vw, 80px)",
} as const;

// Border radius
export const radius = {
  sm: "calc(0.625rem * 0.6)",
  md: "calc(0.625rem * 0.8)",
  lg: "0.625rem",
  xl: "calc(0.625rem * 1.4)",
  "2xl": "calc(0.625rem * 1.8)",
  "3xl": "calc(0.625rem * 2.2)",
  "4xl": "calc(0.625rem * 2.6)",
} as const;

// Animation durations
export const durations = {
  fast: 150,
  normal: 250,
  slow: 350,
  cinematic: 700,
} as const;

// Easing curves
export const easing = {
  linear: "linear" as const,
  in: "cubic-bezier(0.4, 0, 0.2, 1)" as const,
  out: "cubic-bezier(0.0, 0, 0.2, 1)" as const,
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)" as const,
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)" as const,
  expoOut: "cubic-bezier(0.95, 0.05, 0.795, 0.035)" as const,
  expoInOut: "cubic-bezier(1, 0, 0, 1)" as const,
} as const;

// Stagger delays
export const stagger = {
  base: 30,
  item: 50,
  group: 100,
} as const;

// Z-index scale
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
} as const;

// Breakpoints
export const breakpoints = {
  xs: "320px",
  sm: "480px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
  "3xl": "1920px",
} as const;

// Container max-widths
export const containers = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
  full: "100%",
} as const;

// Gutters
export const gutters = {
  sm: "24px",
  md: "48px",
  lg: "64px",
} as const;

// Interaction states
export const interactionStates = {
  hover: {
    scale: 1.01,
    translateY: "-2px",
    background: "var(--color-primary-hover)",
  },
  focus: {
    ringWidth: "2px",
    ringColor: "var(--color-primary)",
    ringOffset: "2px",
    ringOffsetColor: "var(--color-surface-0)",
  },
  active: {
    scale: 0.98,
    translateY: "1px",
  },
  disabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
} as const;

// Combined export for convenience
export const tokens = {
  colors: { primitives: colorPrimitives, semantic: semanticColors },
  fonts,
  fontSizes,
  spacing,
  radius,
  durations,
  easing,
  stagger,
  zIndex,
  breakpoints,
  containers,
  gutters,
  interactionStates,
} as const;

export type Tokens = typeof tokens;