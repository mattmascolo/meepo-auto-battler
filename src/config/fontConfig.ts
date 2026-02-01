/**
 * Font configuration for consistent text rendering
 */

// Primary font: Press Start 2P (retro pixel font) - for titles, headers, buttons
export const FONT_FAMILY = '"Press Start 2P", monospace';

// Secondary font: Inter (clean sans-serif) - for body text, stats, logs
export const FONT_FAMILY_SECONDARY = '"Inter", sans-serif';

// Common text style presets
export const TEXT_STYLES = {
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: '20px',
    color: '#ffffff',
  },
  heading: {
    fontFamily: FONT_FAMILY,
    fontSize: '14px',
    color: '#ffffff',
  },
  body: {
    fontFamily: FONT_FAMILY,
    fontSize: '10px',
    color: '#ffffff',
  },
  small: {
    fontFamily: FONT_FAMILY,
    fontSize: '8px',
    color: '#ffffff',
  },
  button: {
    fontFamily: FONT_FAMILY,
    fontSize: '12px',
    color: '#ffffff',
  },
} as const;
