/**
 * Font configuration for consistent text rendering
 */

// Google Font: Press Start 2P (retro pixel font)
export const FONT_FAMILY = '"Press Start 2P", monospace';

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
