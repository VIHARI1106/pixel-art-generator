// src/utils/mask-utils.js

/**
 * Create a binary mask from drawn shapes.
 * This util is used by SelectorCanvas internally.
 */

export function createEmptyMask(width, height) {
  return new Uint8ClampedArray(width * height);
}

/** Apply a filled region to mask (set = 255 or 0) */
export function applyRegionToMask(mask, width, height, ctx, mode) {
  const imgData = ctx.getImageData(0, 0, width, height).data;

  for (let i = 0; i < width * height; i++) {
    const alpha = imgData[i * 4 + 3];
    if (mode === "add" && alpha > 0) mask[i] = 255;
    if (mode === "remove" && alpha > 0) mask[i] = 0;
  }

  return mask;
}

/** Fill a polygon path on temporary canvas */
export function fillPolygon(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fill();
}

/** Fill a rectangle */
export function fillRect(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
}

/** Fill ellipse */
export function fillEllipse(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.ellipse(
    x + w / 2,
    y + h / 2,
    Math.abs(w / 2),
    Math.abs(h / 2),
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

/** Fill circle (used by circle tool) */
export function fillCircle(ctx, x, y, w, h) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(Math.abs(w / 2), Math.abs(h / 2));

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}
