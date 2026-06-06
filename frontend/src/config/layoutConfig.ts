// Layout constants for the resizable 3-column layout.

export const LAYOUT_DEFAULTS = {
  leftWidth: 280, // px — default left panel width
  rightWidth: 340, // px — default right panel width
  // Center panel gets the remainder (flex: 1).
}

export const LAYOUT_MINIMUMS = {
  left: 180, // px
  center: 300, // px — chessboard minimum
  right: 220, // px
}

export const DIVIDER_WIDTH = 5 // px — visual + hit area width

/**
 * Clamps left/right panel widths against the current window so the center panel
 * never drops below its minimum and each side respects its own minimum.
 */
export function clampLayoutValues(
  left: number,
  right: number,
): { left: number; right: number } {
  const total = window.innerWidth - DIVIDER_WIDTH * 2
  const clampedLeft = Math.max(
    LAYOUT_MINIMUMS.left,
    Math.min(left, total - LAYOUT_MINIMUMS.right - LAYOUT_MINIMUMS.center),
  )
  const clampedRight = Math.max(
    LAYOUT_MINIMUMS.right,
    Math.min(right, total - clampedLeft - LAYOUT_MINIMUMS.center),
  )
  return { left: clampedLeft, right: clampedRight }
}
