// src/utils/spritesheet.js

/**
 * Export the given canvas into a sprite sheet (tile atlas)
 * tileSize: 8, 16, 32, or any desired tile dimension.
 */
export function exportSpriteSheet(canvas, tileSize = 16) {
  if (!canvas) return;

  const w = canvas.width;
  const h = canvas.height;

  const cols = Math.floor(w / tileSize);
  const rows = Math.floor(h / tileSize);

  const sheet = document.createElement("canvas");
  sheet.width = cols * tileSize;
  sheet.height = rows * tileSize;

  const ctx = sheet.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.drawImage(
        canvas,
        col * tileSize,
        row * tileSize,
        tileSize,
        tileSize,
        col * tileSize,
        row * tileSize,
        tileSize,
        tileSize
      );
    }
  }

  const link = document.createElement("a");
  link.download = `spritesheet_${tileSize}.png`;
  link.href = sheet.toDataURL("image/png");
  link.click();
}
