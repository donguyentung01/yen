/**
 * Design tokens for Yên.
 *
 * The HTML mockups in yen-design.md used CSS custom properties
 * (`var(--bg-tint-blue)`) that have no equivalent in React Native. This file is
 * the RN replacement: one place that owns every color, size and radius.
 *
 * Dark-first. The app is opened at night, for sleep content, by someone who is
 * usually not having a great time — and the spec explicitly rules out the
 * pastel Calm/Headspace palette. Tints stay warm and saturated so the emotion
 * grid is scannable by color alone, per the design doc.
 */

/** Tint keys, one per emotional register. Used by triggers and content types. */
export type TintKey = 'blue' | 'orange' | 'green' | 'violet' | 'aqua';

/**
 * Each tint is a pair: a muted background that sits calmly on a dark surface,
 * and a saturated foreground for the icon and label on top of it.
 */
export const tint: Record<TintKey, { bg: string; fg: string }> = {
  // Sadness / heartbreak
  blue: { bg: '#182B44', fg: '#7FB2EA' },
  // Urgency / deadline pressure
  orange: { bg: '#3B2617', fg: '#F0A868' },
  // Burnout / drained battery
  green: { bg: '#183221', fg: '#6FCF97' },
  // Family expectation / "con nhà người ta"
  violet: { bg: '#28213F', fg: '#AC8FEA' },
  // Loneliness / alone at night
  aqua: { bg: '#153230', fg: '#5FCFC4' },
};

export const color = {
  /** App background — the darkest layer. */
  surface0: '#0E0D14',
  /** Screen content container. */
  surface1: '#16151F',
  /** Raised cards sitting on surface1. */
  surface2: '#1E1D29',

  border: '#2A2836',

  textPrimary: '#F2F0F7',
  textSecondary: '#A5A1B5',
  textMuted: '#6E6A80',
};

/**
 * Font sizes lifted directly from the mockups' typography notes so the RN build
 * keeps the same hierarchy the design was tuned at.
 */
export const fontSize = {
  /** Screen title — "Ê, nay sao rồi?" */
  title: 21,
  /** Card headline — the empathetic intro card. */
  headline: 17,
  /** Logo wordmark. */
  brand: 16,
  /** List item titles. */
  item: 14,
  /** Metadata and subtitles. */
  meta: 13,
  /** Smaller metadata — duration, content type. */
  metaSmall: 12,
  /** Muted footer text. */
  footnote: 11,
};

export const radius = {
  /** Content cards and list rows. */
  card: 12,
  /** Quick-play cards. */
  cardLoose: 14,
  /** Emotion tiles and the intro card — the roundest things on screen. */
  tile: 16,
  /** The icon-in-a-square pattern repeated throughout. */
  iconSquare: 10,
  /** Streak badge. */
  pill: 999,
};

export const spacing = {
  /** Tight — between a title and its subtitle. */
  xs: 4,
  sm: 8,
  md: 12,
  /** Standard screen gutter. */
  lg: 16,
  /** Between major sections. */
  xl: 20,
};

/** Hairline dividers. RN has no `0.5px` literal, but fractional widths work. */
export const hairline = 0.5;
