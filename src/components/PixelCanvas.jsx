// FIXED PixelCanvas.jsx
import React, { useEffect, useRef } from "react";

export default function PixelCanvas({
  image,
  pixelSize,
  palette,
  dither,
  mask,
  editableCanvasRef
}) {
  const canvasRef = editableCanvasRef; // The SAME canvas used by SelectorCanvas

  useEffect(() => {
    if (!image) return;
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const w = image.naturalWidth;
    const h = image.naturalHeight;

    canvas.width = w;
    canvas.height = h;
    ctx.imageSmoothingEnabled = false;

    // 1. Draw original
    ctx.drawImage(image, 0, 0);

    // No mask? nothing to do
    if (!mask) return;

    const smallW = Math.max(1, Math.round(w / pixelSize));
    const smallH = Math.max(1, Math.round(h / pixelSize));

    // 2. Downscale
    const t = document.createElement("canvas");
    t.width = smallW;
    t.height = smallH;
    const tctx = t.getContext("2d");
    tctx.imageSmoothingEnabled = false;
    tctx.drawImage(image, 0, 0, smallW, smallH);

    // 3. Palette mapping
    let imgData = tctx.getImageData(0, 0, smallW, smallH);
    const data = imgData.data;

    if (palette.length > 0) {
      if (dither && window.applyFloyd) {
        window.applyFloyd(imgData, smallW, smallH, palette);
      } else {
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          let best = 0;
          let bestD = Infinity;

          for (let p = 0; p < palette.length; p++) {
            const pc = palette[p];
            const dr = r - pc.r;
            const dg = g - pc.g;
            const db = b - pc.b;
            const d = dr * dr + dg * dg + db * db;
            if (d < bestD) {
              bestD = d;
              best = p;
            }
          }

          const c = palette[best];
          data[i] = c.r;
          data[i + 1] = c.g;
          data[i + 2] = c.b;
        }
      }
      tctx.putImageData(imgData, 0, 0);
    }

    // 4. Upscale pixelated version
    const big = document.createElement("canvas");
    big.width = w;
    big.height = h;
    const bctx = big.getContext("2d");
    bctx.imageSmoothingEnabled = false;
    bctx.drawImage(t, 0, 0, w, h);

    const pixelData = bctx.getImageData(0, 0, w, h);
    const original = ctx.getImageData(0, 0, w, h);

    const pd = pixelData.data;
    const od = original.data;

    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === 255) {
        const p = i * 4;
        od[p] = pd[p];
        od[p + 1] = pd[p + 1];
        od[p + 2] = pd[p + 2];
      }
    }

    ctx.putImageData(original, 0, 0);
  }, [image, pixelSize, palette, dither, mask]);

  return null; // canvas is externally controlled
}
