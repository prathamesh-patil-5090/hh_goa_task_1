"use client";

import { useCallback, useEffect, useRef } from "react";
import { CropAdjust, DEFAULT_CROP, drawCover } from "@/lib/canvas";

type Props = {
  photo: HTMLImageElement;
  shape: "circle" | "square";
  value: CropAdjust;
  onChange: (next: CropAdjust) => void;
};

export default function PhotoAdjuster({ photo, shape, value, onChange }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const clamp = useCallback((next: CropAdjust): CropAdjust => {
    return {
      scale: Math.max(1, Math.min(3, next.scale)),
      offsetX: Math.max(-1, Math.min(1, next.offsetX)),
      offsetY: Math.max(-1, Math.min(1, next.offsetY)),
    };
  }, []);

  // Paint live crop preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = 360;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, size, size);
    drawCover(ctx, photo, 0, 0, size, size, value);
  }, [photo, value]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    stageRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };

    const sens = 2.4 / value.scale;
    onChange(
      clamp({
        ...value,
        offsetX: value.offsetX + (dx / rect.width) * sens,
        offsetY: value.offsetY + (dy / rect.height) * sens,
      }),
    );
  };

  const endDrag = () => {
    dragging.current = false;
  };

  return (
    <div className="cropper">
      <div className="cropper-head">
        <span>Adjust photo</span>
        <button type="button" className="cropper-reset" onClick={() => onChange(DEFAULT_CROP)}>
          Reset
        </button>
      </div>

      <div
        ref={stageRef}
        className={`cropper-stage ${shape}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="presentation"
      >
        <canvas ref={canvasRef} className="cropper-canvas" />
        <div className="cropper-hint">Drag to reposition</div>
      </div>

      <label className="cropper-zoom">
        <span>Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={value.scale}
          onChange={(e) =>
            onChange(clamp({ ...value, scale: Number(e.target.value) }))
          }
        />
        <em>{value.scale.toFixed(1)}×</em>
      </label>
    </div>
  );
}
