// utils/mask.js
// Creates & manipulates a bitmap mask for pixel-level selection.
// mask is Uint8Array(w*h), 0 = unselected, 255 = selected.

export function createMask(width, height) {
  return new Uint8Array(width * height);
}

// Add a filled rectangle into mask
export function addRect(mask, w, h, x1, y1, x2, y2, remove = false) {
  const xmin = Math.max(0, Math.min(x1, x2));
  const xmax = Math.min(w, Math.max(x1, x2));
  const ymin = Math.max(0, Math.min(y1, y2));
  const ymax = Math.min(h, Math.max(y1, y2));

  for (let y = ymin; y <= ymax; y++) {
    for (let x = xmin; x <= xmax; x++) {
      const idx = y * w + x;
      mask[idx] = remove ? 0 : 255;
    }
  }
}

// Add a filled ellipse / circle
export function addEllipse(mask, w, h, cx, cy, rx, ry, remove = false) {
  for (let y = cy - ry; y <= cy + ry; y++) {
    for (let x = cx - rx; x <= cx + rx; x++) {
      if (x < 0 || x >= w || y < 0 || y >= h) continue;

      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        const idx = y * w + x;
        mask[idx] = remove ? 0 : 255;
      }
    }
  }
}

export function cloneMask(mask) {
  return new Uint8Array(mask);
}
