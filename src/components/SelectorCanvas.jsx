// src/components/SelectorCanvas.jsx — Selection Editor ONLY (no pixelation)

import React, { useRef, useEffect, useState } from "react";
import { getCanvasPoint, applyZoom, applyPan } from "../utils/zoom-utils";

export default function SelectorCanvas({ image, canvasRef, onMaskUpdate }) {
  const overlayRef = useRef(null);

  // Tools
  const [tool, setTool] = useState("rect");    // rect | circle | ellipse | lasso
  const [mode, setMode] = useState("add");     // add | remove

  const [drawing, setDrawing] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [lassoPoints, setLassoPoints] = useState([]);

  const [shapes, setShapes] = useState([]);

  // Zoom + Pan
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Initialize editor canvas
  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    ctx.drawImage(image, 0, 0);
    resizeOverlay();
  }, [image]);

  useEffect(() => {
    drawOverlay();
    generateMask();
  }, [shapes, scale, offset]);

  function resizeOverlay() {
    const main = canvasRef.current;
    const overlay = overlayRef.current;
    if (!main || !overlay) return;

    overlay.width = main.width;
    overlay.height = main.height;
  }

  /** Draw shape */
  function drawShape(ctx, s) {
    ctx.beginPath();

    if (s.type === "rect") {
      ctx.rect(s.x, s.y, s.w, s.h);
    }

    if (s.type === "circle") {
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      const r = Math.min(Math.abs(s.w / 2), Math.abs(s.h / 2));
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }

    if (s.type === "ellipse") {
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      ctx.ellipse(cx, cy, Math.abs(s.w / 2), Math.abs(s.h / 2), 0, 0, Math.PI * 2);
    }

    if (s.type === "lasso") {
      ctx.moveTo(s.points[0].x, s.points[0].y);
      s.points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.closePath();
    }

    ctx.strokeStyle = s.mode === "add" ? "#00ff88" : "#ff0066";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /** Draw overlay */
  function drawOverlay(preview = null) {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d");

    overlay.width = overlay.width;

    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, offset.x, offset.y);

    shapes.forEach((s) => drawShape(ctx, s));
    if (preview) drawShape(ctx, preview);

    ctx.restore();
  }

  /** Mouse Down */
  function handleMouseDown(e) {
    if (!image) return;

    if (e.button === 1) {
      setIsPanning(true);
      const rect = overlayRef.current.getBoundingClientRect();
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      return;
    }

    const rect = overlayRef.current.getBoundingClientRect();
    const p = getCanvasPoint(e, rect, offset, scale);

    setStart(p);
    setDrawing(true);

    if (tool === "lasso") {
      setLassoPoints([p]);
    }
  }

  /** Mouse Move */
  function handleMouseMove(e) {
    if (isPanning) {
      const newOffset = applyPan(e, panStart);
      setOffset(newOffset);
      drawOverlay();
      return;
    }

    if (!drawing) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const p = getCanvasPoint(e, rect, offset, scale);

    if (tool === "lasso") {
      const points = [...lassoPoints, p];
      setLassoPoints(points);
      drawOverlay({ type: "lasso", mode, points });
      return;
    }

    const preview = {
      type: tool,
      mode,
      x: start.x,
      y: start.y,
      w: p.x - start.x,
      h: p.y - start.y,
    };

    drawOverlay(preview);
  }

  /** Mouse Up */
  function handleMouseUp(e) {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!drawing) return;
    setDrawing(false);

    const rect = overlayRef.current.getBoundingClientRect();
    const p = getCanvasPoint(e, rect, offset, scale);

    if (tool === "lasso") {
      setShapes((prev) => [...prev, { type: "lasso", mode, points: lassoPoints }]);
      setLassoPoints([]);
      return;
    }

    const newShape = {
      type: tool,
      mode,
      x: start.x,
      y: start.y,
      w: p.x - start.x,
      h: p.y - start.y,
    };

    setShapes((prev) => [...prev, newShape]);
  }

  /** Zoom */
  function handleWheel(e) {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    setScale(applyZoom(scale, delta));
  }

  /** Undo */
  function undo() {
    setShapes((prev) => prev.slice(0, -1));
  }

  /** Clear all */
  function clearAll() {
    setShapes([]);
  }

  /** Mask generation */
  function generateMask() {
    if (!canvasRef.current || shapes.length === 0) {
      onMaskUpdate(null);
      return;
    }

    const canvas = canvasRef.current;
    const w = canvas.width;
    const h = canvas.height;

    const temp = document.createElement("canvas");
    temp.width = w;
    temp.height = h;

    const ctx = temp.getContext("2d");

    shapes.forEach((s) => {
      ctx.save();

      ctx.beginPath();

      if (s.type === "rect") ctx.rect(s.x, s.y, s.w, s.h);

      if (s.type === "circle") {
        const cx = s.x + s.w / 2;
        const cy = s.y + s.h / 2;
        const r = Math.min(Math.abs(s.w / 2), Math.abs(s.h / 2));
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
      }

      if (s.type === "ellipse") {
        const cx = s.x + s.w / 2;
        const cy = s.y + s.h / 2;
        ctx.ellipse(cx, cy, Math.abs(s.w / 2), Math.abs(s.h / 2), 0, 0, Math.PI * 2);
      }

      if (s.type === "lasso") {
        ctx.moveTo(s.points[0].x, s.points[0].y);
        s.points.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.closePath();
      }

      if (s.mode === "add") {
        ctx.fillStyle = "white";
        ctx.fill();
      } else {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.restore();
    });

    const raw = ctx.getImageData(0, 0, w, h).data;
    const mask = new Uint8ClampedArray(w * h);

    for (let i = 0; i < w * h; i++) {
      mask[i] = raw[i * 4] > 0 ? 255 : 0;
    }

    onMaskUpdate(mask);
  }

  return (
  <div>

    {/* TOOLBAR (moved OUTSIDE so overlay doesn't block clicks) */}
    <div className="flex gap-2 mb-2">
      <button onClick={() => setTool("rect")} className="px-2 py-1 bg-gray-200 rounded">Rect</button>
      <button onClick={() => setTool("circle")} className="px-2 py-1 bg-gray-200 rounded">Circle</button>
      <button onClick={() => setTool("ellipse")} className="px-2 py-1 bg-gray-200 rounded">Ellipse</button>
      <button onClick={() => setTool("lasso")} className="px-2 py-1 bg-gray-200 rounded">Lasso</button>

      <button onClick={() => setMode("add")} className="px-2 py-1 bg-green-300 rounded">Add</button>
      <button onClick={() => setMode("remove")} className="px-2 py-1 bg-red-300 rounded">Remove</button>

      <button onClick={undo} className="px-2 py-1 bg-yellow-300 rounded">Undo</button>
      <button onClick={clearAll} className="px-2 py-1 bg-gray-300 rounded">Clear</button>
    </div>

    {/* EDITOR BLOCK */}
    <div style={{ position: "relative", display: "inline-block" }}>
      
      {/* Base canvas */}
      <canvas ref={canvasRef} style={{ display: "block" }} />

      {/* Overlay canvas */}
      <canvas
        ref={overlayRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          cursor: "crosshair",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>

  </div>
);
}