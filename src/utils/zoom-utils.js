// src/utils/zoom-utils.js

/**
 * Convert client mouse coordinates → canvas coordinates
 * considering zoom and pan.
 */
export function getCanvasPoint(e, rect, offset, scale) {
  const x = (e.clientX - rect.left - offset.x) / scale;
  const y = (e.clientY - rect.top - offset.y) / scale;
  return { x, y };
}

/**
 * Clamp zoom scale
 */
export function applyZoom(currentScale, delta, min = 0.3, max = 5) {
  let newScale = currentScale - delta * 0.1;
  if (newScale < min) newScale = min;
  if (newScale > max) newScale = max;
  return newScale;
}

/**
 * Apply panning offset
 */
export function applyPan(e, panStart) {
  return {
    x: e.clientX - panStart.x,
    y: e.clientY - panStart.y
  };
}
