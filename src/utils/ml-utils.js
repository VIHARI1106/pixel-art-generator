// src/utils/ml-utils.js
import * as tf from "@tensorflow/tfjs";

/**
 * Load a TFJS model from URL.
 * Supports both GraphModel and LayersModel.
 */
export async function loadTFModel(modelUrl) {
  try {
    const graph = await tf.loadGraphModel(modelUrl);
    console.log("Loaded GraphModel:", modelUrl);
    return graph;
  } catch (err) {
    console.warn("GraphModel failed, trying LayersModel...");
  }

  try {
    const layers = await tf.loadLayersModel(modelUrl);
    console.log("Loaded LayersModel:", modelUrl);
    return layers;
  } catch (err) {
    console.error("Failed to load any model:", err);
    alert("Model load failed. Check console for details.");
    return null;
  }
}

/**
 * Preprocess pixels:
 * Convert canvas → tensor [1, H, W, 3] normalized.
 */
function preprocessCanvas(img, x, y, w, h) {
  const tmp = document.createElement("canvas");
  tmp.width = w;
  tmp.height = h;

  const ctx = tmp.getContext("2d");
  ctx.drawImage(img, x, y, w, h, 0, 0, w, h);

  let input = tf.browser.fromPixels(tmp).toFloat();
  input = input.div(255);      // normalize 0..1
  input = input.expandDims(0); // [1,H,W,3]

  return input;
}

/**
 * Detect if output tensor is:
 * - [-1,1] range
 * - [0,1] range
 * - [0,255] range
 */
function normalizeOutput(t) {
  const min = t.min().dataSync()[0];
  const max = t.max().dataSync()[0];

  let out = t;

  if (min < -0.5 && max <= 1.2) {
    // Probably [-1,1]
    out = t.add(1).div(2);
  } else if (min >= 0 && max <= 1) {
    // Already 0–1
    out = t;
  } else if (max > 1) {
    // Probably 0–255 range
    out = t.div(255);
  }

  return out;
}

/**
 * Convert output tensor to ImageData
 */
async function tensorToImageData(tensor) {
  const [h, w, c] = tensor.shape;

  // TFJS toPixels returns RGBA
  const rgba = await tf.browser.toPixels(tensor);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  const imgData = ctx.createImageData(w, h);
  imgData.data.set(rgba);
  ctx.putImageData(imgData, 0, 0);

  return canvas;
}

/**
 * MAIN PROCESS:
 * Run model on selected region and apply back to main canvas.
 */
export async function runStylization(canvas, imgObj, mask, model) {
  if (!canvas || !imgObj || !mask || !model) return;

  const w = canvas.width;
  const h = canvas.height;

  // Full mask → determine bounding box
  let minX = w, minY = h, maxX = 0, maxY = 0;

  for (let i = 0; i < w * h; i++) {
    if (mask[i] === 255) {
      const x = i % w;
      const y = Math.floor(i / w);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  // If no selection, exit
  if (minX > maxX || minY > maxY) return;

  const regionW = maxX - minX + 1;
  const regionH = maxY - minY + 1;

  // Preprocess for model
  let input = preprocessCanvas(imgObj, minX, minY, regionW, regionH);

  // Execute model
  let output;
  try {
    output = model.executeAsync
      ? await model.executeAsync(input)
      : await model.predict(input);
  } catch (e) {
    console.error("Model execution error:", e);
    alert("Model execution failed. Check console.");
    input.dispose();
    return;
  }

  // Remove batch dimension
  let outTensor = Array.isArray(output) ? output[0] : output;
  if (outTensor.shape.length === 4) {
    outTensor = outTensor.squeeze();
  }

  // Normalize predicted output
  const normalized = normalizeOutput(outTensor);

  // Convert tensor → canvas
  const stylizedCanvas = await tensorToImageData(normalized);

  // Clean GPU tensors
  input.dispose();
  outTensor.dispose();
  if (Array.isArray(output)) output.forEach((t) => t.dispose());
  else output.dispose && output.dispose();

  // Draw masked region to main canvas
  const ctx = canvas.getContext("2d");
  const outCTX = stylizedCanvas.getContext("2d");
  const outData = outCTX.getImageData(0, 0, regionW, regionH).data;

  const original = ctx.getImageData(0, 0, w, h);

  for (let y = 0; y < regionH; y++) {
    for (let x = 0; x < regionW; x++) {
      const globalX = minX + x;
      const globalY = minY + y;

      const index = globalY * w + globalX;

      if (mask[index] === 255) {
        const src = (y * regionW + x) * 4;
        const dst = index * 4;

        original.data[dst] = outData[src];
        original.data[dst + 1] = outData[src + 1];
        original.data[dst + 2] = outData[src + 2];
        original.data[dst + 3] = 255;
      }
    }
  }

  ctx.putImageData(original, 0, 0);
}
