// src/utils/quantize.js

/** Convert RGB → HEX */
export function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Convert HEX → RGB */
export function hexToRgb(hex) {
  hex = hex.replace("#", "");
  return [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16),
  ];
}

/** Return nearest palette color */
export function nearestColor(r, g, b, palette) {
  let best = null;
  let bestDist = Infinity;

  for (const p of palette) {
    const dr = r - p.r;
    const dg = g - p.g;
    const db = b - p.b;
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) {
      bestDist = dist;
      best = p;
    }
  }
  return best;
}

/**
 * K-MEANS QUANTIZATION
 * Efficient + simplified version for pixel-art / downscaled images.
 */
export function kMeansQuantize(data, k = 8, maxSamples = 4000, iters = 12) {
  const totalPixels = data.length / 4;

  // sample pixels
  const step = Math.max(1, Math.floor(totalPixels / maxSamples));
  const samples = [];

  for (let i = 0; i < totalPixels; i += step) {
    const idx = i * 4;
    if (data[idx + 3] === 0) continue;
    samples.push([data[idx], data[idx + 1], data[idx + 2]]);
  }

  if (samples.length === 0) return [];

  // random initial seeds
  const centroids = [];
  const used = new Set();
  while (centroids.length < k) {
    const r = Math.floor(Math.random() * samples.length);
    if (!used.has(r)) {
      used.add(r);
      centroids.push(samples[r].slice());
    }
  }

  // run k-means iterations
  for (let iter = 0; iter < iters; iter++) {
    const clusters = Array.from({ length: k }, () => ({
      r: 0,
      g: 0,
      b: 0,
      count: 0,
    }));

    // assign pixels
    for (let s = 0; s < samples.length; s++) {
      const px = samples[s];
      let best = 0;
      let bestDist = Infinity;

      for (let c = 0; c < k; c++) {
        const ce = centroids[c];
        const dr = px[0] - ce[0];
        const dg = px[1] - ce[1];
        const db = px[2] - ce[2];
        const d = dr * dr + dg * dg + db * db;
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }

      clusters[best].r += px[0];
      clusters[best].g += px[1];
      clusters[best].b += px[2];
      clusters[best].count++;
    }

    // recompute centroids
    let changed = false;
    for (let c = 0; c < k; c++) {
      if (clusters[c].count === 0) continue;

      const nr = Math.round(clusters[c].r / clusters[c].count);
      const ng = Math.round(clusters[c].g / clusters[c].count);
      const nb = Math.round(clusters[c].b / clusters[c].count);

      if (
        nr !== centroids[c][0] ||
        ng !== centroids[c][1] ||
        nb !== centroids[c][2]
      ) {
        centroids[c] = [nr, ng, nb];
        changed = true;
      }
    }

    if (!changed) break;
  }

  // convert to palette objects
  return centroids.map((c) => ({
    r: c[0],
    g: c[1],
    b: c[2],
    hex: rgbToHex(c[0], c[1], c[2]),
  }));
}

/**
 * FLOYD–STEINBERG DITHERING
 */
export function applyFloydSteinberg(imageData, w, h, palette) {
  const d = imageData.data;

  const clamp = (v) => Math.max(0, Math.min(255, v | 0));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;

      const oldR = d[idx];
      const oldG = d[idx + 1];
      const oldB = d[idx + 2];

      const nearest = nearestColor(oldR, oldG, oldB, palette);

      const newR = nearest.r;
      const newG = nearest.g;
      const newB = nearest.b;

      d[idx] = newR;
      d[idx + 1] = newG;
      d[idx + 2] = newB;

      const errR = oldR - newR;
      const errG = oldG - newG;
      const errB = oldB - newB;

      // distribute error
      function spread(xx, yy, factor) {
        const nx = x + xx;
        const ny = y + yy;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) return;

        const nidx = (ny * w + nx) * 4;
        d[nidx] = clamp(d[nidx] + errR * factor);
        d[nidx + 1] = clamp(d[nidx + 1] + errG * factor);
        d[nidx + 2] = clamp(d[nidx + 2] + errB * factor);
      }

      spread(1, 0, 7 / 16);
      spread(-1, 1, 3 / 16);
      spread(0, 1, 5 / 16);
      spread(1, 1, 1 / 16);
    }
  }
}
