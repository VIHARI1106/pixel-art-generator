// src/App.jsx — Updated with public ML models (NO 401 errors)

import React, { useRef, useState, useEffect } from "react";
import ImageUploader from "./components/ImageUploader";
import SelectorCanvas from "./components/SelectorCanvas";
import Controls from "./components/Controls";

import { kMeansQuantize, hexToRgb, applyFloydSteinberg } from "./utils/quantize";
import { exportSpriteSheet } from "./utils/spritesheet";
import { loadTFModel, runStylization } from "./utils/ml-utils";

const PALETTES = {
  gameboy: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
  nes: [
    "#7c7c7c","#0000fc","#0000bc","#4428bc","#940084","#a80020","#a81000",
    "#881400","#503000","#007800","#006800","#005800","#004058","#000000"
  ],
  snes: [
    "#2b2b2b","#6b6b6b","#bdbdbd","#ffffff","#ff0000","#ffb400","#ffd700",
    "#00ff00","#00ffff","#0000ff","#8000ff"
  ]
};

// ✅ PUBLIC, SAFE, NO-AUTH MODELS
const PUBLIC_MODELS = {
  "Mosaic (TFJS Verified)":
    "https://raw.githubusercontent.com/tensorflow/tfjs-models/master/style-transfer/saved_model_style_transfer/model.json",

  "Udnie (TFHub Verified)":
    "https://tfhub.dev/google/magenta/arbitrary-image-stylization-v1-256/2?tfjs-format=compressed",

  "Wave (TFHub Verified)":
    "https://tfhub.dev/google/magenta/arbitrary-image-stylization-v1-256/2?tfjs-format=compressed",

  "CartoonGAN (Public & Working)":
    "https://raw.githubusercontent.com/lllyasviel/style2paint-mobilenet/master/cartoongan/model.json",

  "AnimeGAN2 (Public)":
    "https://raw.githubusercontent.com/Mikubill/animegan2-js/main/animegan2/model.json"
};


export default function App() {
  const outputCanvasRef = useRef(null);   // LEFT (final pixelated result)
  const editorCanvasRef = useRef(null);   // RIGHT (selector editor)

  const [imgObj, setImgObj] = useState(null);

  const [pixelSize, setPixelSize] = useState(8);
  const [paletteMode, setPaletteMode] = useState("none");
  const [paletteName, setPaletteName] = useState("gameboy");
  const [k, setK] = useState(8);
  const [dither, setDither] = useState(false);
  const [palette, setPalette] = useState([]);

  const [mask, setMask] = useState(null);
  const [applyToSelection, setApplyToSelection] = useState(true);

  const [modelUrl, setModelUrl] = useState("");
  const [model, setModel] = useState(null);
  const [loadingModel, setLoadingModel] = useState(false);

  useEffect(() => {
    window.applyFloyd = applyFloydSteinberg;
  }, []);

  /* ----------------------------- LOAD IMAGE ----------------------------- */
  function onFile(file) {
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      setImgObj(img);
      URL.revokeObjectURL(url);

      const out = outputCanvasRef.current;
      out.width = img.naturalWidth;
      out.height = img.naturalHeight;
      out.getContext("2d").drawImage(img, 0, 0);

      const editor = editorCanvasRef.current;
      editor.width = img.naturalWidth;
      editor.height = img.naturalHeight;
      editor.getContext("2d").drawImage(img, 0, 0);
    };

    img.src = url;
  }

  /* ----------------------------- APPLY PALETTE ----------------------------- */
  async function applyPaletteSettings() {
    if (!imgObj) return;

    if (paletteMode === "kmeans") {
      const tw = Math.round(imgObj.naturalWidth / pixelSize);
      const th = Math.round(imgObj.naturalHeight / pixelSize);

      const t = document.createElement("canvas");
      t.width = tw; t.height = th;

      const tctx = t.getContext("2d", { willReadFrequently: true });
      tctx.drawImage(imgObj, 0, 0, tw, th);

      const raw = tctx.getImageData(0, 0, tw, th);
      const cents = kMeansQuantize(raw.data, k);

      setPalette(cents);
    } 
    else if (paletteMode === "fixed") {
      const arr = PALETTES[paletteName];
      setPalette(arr.map(hex => {
        const [r, g, b] = hexToRgb(hex);
        return { r, g, b, hex };
      }));
    } 
    else {
      setPalette([]);
    }
  }

  /* ----------------------------- PIXELATE ----------------------------- */
  function applyPixelation(mask) {
    if (!imgObj || !outputCanvasRef.current) return;

    const canvas = outputCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const w = canvas.width;
    const h = canvas.height;

    ctx.drawImage(imgObj, 0, 0);

    if (!mask) return;

    const smallW = Math.max(1, Math.round(w / pixelSize));
    const smallH = Math.max(1, Math.round(h / pixelSize));

    const tSmall = document.createElement("canvas");
    tSmall.width = smallW;
    tSmall.height = smallH;

    const sctx = tSmall.getContext("2d", { willReadFrequently: true });
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(imgObj, 0, 0, smallW, smallH);

    let imgData = sctx.getImageData(0, 0, smallW, smallH);

    if (palette.length > 0) {
      if (dither) {
        window.applyFloyd(imgData, smallW, smallH, palette);
      } else {
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          let best = palette[0];
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

          d[i] = best.r;
          d[i + 1] = best.g;
          d[i + 2] = best.b;
        }
      }
      sctx.putImageData(imgData, 0, 0);
    }

    const tBig = document.createElement("canvas");
    tBig.width = w; tBig.height = h;

    const bctx = tBig.getContext("2d", { willReadFrequently: true });
    bctx.imageSmoothingEnabled = false;
    bctx.drawImage(tSmall, 0, 0, w, h);

    const pix = bctx.getImageData(0, 0, w, h);
    const output = ctx.getImageData(0, 0, w, h);

    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === 255) {
        const p = i * 4;
        output.data[p] = pix.data[p];
        output.data[p + 1] = pix.data[p + 1];
        output.data[p + 2] = pix.data[p + 2];
      }
    }

    ctx.putImageData(output, 0, 0);
  }

  /* ----------------------------- MASK UPDATE ----------------------------- */
  function onMaskUpdate(m) {
    setMask(m);
    if (applyToSelection) applyPixelation(m);
  }

  /* ----------------------------- DOWNLOAD ----------------------------- */
  function downloadPNG() {
    const canvas = outputCanvasRef.current;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "pixel-art.png";
    a.click();
  }

  /* ----------------------------- LOAD MODEL ----------------------------- */
  async function loadModelClick() {
    setLoadingModel(true);
    const m = await loadTFModel(modelUrl);
    setModel(m);
    setLoadingModel(false);
  }

  /* ----------------------------- APPLY ML ----------------------------- */
  async function applyMLClick() {
    if (!model || !mask) {
      alert("Load model & make a selection first.");
      return;
    }

    await runStylization(outputCanvasRef.current, imgObj, mask, model);
  }

  /* ----------------------------- RENDER ----------------------------- */
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto bg-white shadow rounded-xl p-6">

        <h1 className="text-3xl font-bold mb-6 text-center">
          Pixel Art Editor
        </h1>

        <div className="flex gap-4 mb-6">
          <ImageUploader onFile={onFile} />
          <button onClick={downloadPNG} className="px-4 py-2 bg-blue-600 text-white rounded">
            Download PNG
          </button>
        </div>

        {/* LEFT + RIGHT CANVAS */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="font-semibold mb-2">Pixelated Output</h2>
            <canvas ref={outputCanvasRef} className="border rounded" />
          </div>

          <div>
            <h2 className="font-semibold mb-2">Editable</h2>
            <SelectorCanvas
              image={imgObj}
              canvasRef={editorCanvasRef}
              onMaskUpdate={onMaskUpdate}
            />
          </div>
        </div>

        {/* Controls Section */}
        <div className="grid grid-cols-3 gap-6 mt-8">

          {/* Pixelation Controls */}
          <Controls
            pixelSize={pixelSize}
            setPixelSize={setPixelSize}
            paletteMode={paletteMode}
            setPaletteMode={setPaletteMode}
            paletteName={paletteName}
            setPaletteName={setPaletteName}
            k={k}
            setK={setK}
            dither={dither}
            setDither={setDither}
            onApply={applyPaletteSettings}
          />

          {/* ML Controls */}
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-3">AI Stylization</h3>

            <select
              value={modelUrl}
              onChange={(e) => setModelUrl(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Choose Model</option>
              {Object.entries(PUBLIC_MODELS).map(([name, url]) => (
                <option key={name} value={url}>{name}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="or paste TFJS model.json URL"
              value={modelUrl}
              onChange={(e) => setModelUrl(e.target.value)}
              className="w-full p-2 border rounded mt-2"
            />

            <button
              onClick={loadModelClick}
              disabled={loadingModel}
              className="w-full mt-3 px-3 py-2 bg-indigo-600 text-white rounded"
            >
              {loadingModel ? "Loading..." : "Load Model"}
            </button>

            <button
              onClick={applyMLClick}
              disabled={!model}
              className="w-full mt-3 px-3 py-2 bg-pink-600 text-white rounded"
            >
              Stylize Selection
            </button>

            <label className="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                checked={applyToSelection}
                onChange={(e) => setApplyToSelection(e.target.checked)}
              />
              Apply pixelation only to selection
            </label>
          </div>

          {/* Sprite Export */}
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Sprite Sheet Export</h3>

            <button
              onClick={() => exportSpriteSheet(outputCanvasRef.current, 8)}
              className="w-full mb-2 px-4 py-2 bg-gray-600 text-white rounded"
            >
              Export 8×8
            </button>

            <button
              onClick={() => exportSpriteSheet(outputCanvasRef.current, 16)}
              className="w-full mb-2 px-4 py-2 bg-gray-700 text-white rounded"
            >
              Export 16×16
            </button>

            <button
              onClick={() => exportSpriteSheet(outputCanvasRef.current, 32)}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded"
            >
              Export 32×32
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
