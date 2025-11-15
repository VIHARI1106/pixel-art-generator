// Controls.jsx — FIXED VERSION

export default function Controls({
  pixelSize,
  setPixelSize,
  paletteMode,
  setPaletteMode,
  paletteName,
  setPaletteName,
  k,
  setK,
  dither,
  setDither,
  onApply
}) {
  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-semibold mb-3">Pixelation Controls</h3>

      {/* Pixel Size */}
      <label className="block font-medium">Pixel Size: {pixelSize}px</label>
      <input
        type="range"
        min="1"
        max="50"
        value={pixelSize}
        onChange={(e) => setPixelSize(Number(e.target.value))}
        className="w-full mb-4"
      />

      {/* Palette Mode */}
      <label className="block font-medium">Palette Mode</label>
      <select
        value={paletteMode}
        onChange={(e) => setPaletteMode(e.target.value)}
        className="w-full p-2 border rounded mb-3"
      >
        <option value="none">None (Full Color)</option>
        <option value="fixed">Fixed Palette</option>
        <option value="kmeans">K-means Palette</option>
      </select>

      {/* Fixed Palettes */}
      {paletteMode === "fixed" && (
        <div className="mb-3">
          <label className="block font-medium">Select Palette</label>
          <select
            value={paletteName}
            onChange={(e) => setPaletteName(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="gameboy">GameBoy</option>
            <option value="nes">NES</option>
            <option value="snes">SNES</option>
          </select>
        </div>
      )}

      {/* K-Means */}
      {paletteMode === "kmeans" && (
        <div className="mb-3">
          <label className="block font-medium">Number of Colors (K)</label>
          <input
            type="number"
            min="2"
            max="32"
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
      )}

      {/* Dithering */}
      <label className="flex items-center gap-2 mb-3">
        <input
          type="checkbox"
          checked={dither}
          onChange={(e) => setDither(e.target.checked)}
        />
        Apply Floyd–Steinberg Dithering
      </label>

      {/* APPLY BUTTON */}
      <button
        onClick={onApply}
        className="w-full px-4 py-2 bg-green-600 text-white rounded"
      >
        Apply Palette
      </button>
    </div>
  );
}
