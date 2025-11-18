/**
 * Configuration file for InteractivePoints component
 * Contains all magic numbers and constants
 */

export const INTERACTIVE_POINTS_CONFIG = {
  // Animation timing (milliseconds)
  ANIMATION_DURATION: 1000,

  // Animation smoothness factor (0-1, lower = smoother but slower)
  LERP_FACTOR: 0.15,

  // Interaction distances
  TRIGGER_DISTANCE_MULTIPLIER: 1.5,
  DEFAULT_POINT_SIZE: 20,

  // Hover effects
  CIRCLE_SIZE_MULTIPLIER: 0.8, // How much the circle grows on hover
  TEXT_SCALE_INTENSITY: 0.3, // How much text scales on hover (black points only)

  // Connection line styling
  LINE_STROKE_WIDTH: 2,
  LINE_OPACITY: 0.6,
  LINE_OPACITY_TRANSITION: "opacity 0.3s ease-out",

  // Point styling
  WHITE_POINT_BOX_SHADOW: "0 0 20px rgba(255,255,255,0.3)",
  BLACK_POINT_BOX_SHADOW: "none",
  BOX_SHADOW_TRANSITION: "box-shadow 0.3s ease-out",

  // Text styling
  BLACK_POINT_FONT_SIZE: "clamp(0.875rem,2.5vw,1.5rem)",
  WHITE_POINT_FONT_SIZE: "clamp(0.75rem,2vw,1rem)",
  TEXT_OFFSET_FROM_CIRCLE: 16, // pixels

  // Pull force calculation
  PULL_FORCE_DIVISOR: 2,

  // Threshold for animation frame updates
  POSITION_THRESHOLD: 0.5,
  SIZE_THRESHOLD: 0.1,
  SCALE_THRESHOLD: 0.01,

  // Colors
  BLACK_COLOR: "#000000",
  WHITE_COLOR: "#FFFFFF",

  // Z-index values
  SVG_Z_INDEX: 1,
  POINT_Z_INDEX: 10,

  // Position calculation divisor
  PERCENTAGE_DIVISOR: 100,
};
