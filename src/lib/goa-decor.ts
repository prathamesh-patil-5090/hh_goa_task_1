import { BRAND } from "./brand";

/** Rising half-sun with rays — classic HH Goa motif. */
export function drawHalfSun(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string = BRAND.accent,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(3, r * 0.08);
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
  ctx.closePath();
  ctx.fill();

  const rays = 7;
  const rayLen = r * 0.7;
  for (let i = 0; i < rays; i++) {
    const angle = Math.PI + (i * Math.PI) / (rays - 1);
    const inset = r + 6;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inset, cy + Math.sin(angle) * inset);
    ctx.lineTo(
      cx + Math.cos(angle) * (inset + rayLen),
      cy + Math.sin(angle) * (inset + rayLen),
    );
    ctx.stroke();
  }
  ctx.restore();
}

/** Simple palm silhouette for card corners. */
export function drawPalm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1,
  flip = false,
  color: string = "rgba(11,104,57,0.16)",
) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Trunk
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-8, -70, 6, -140);
  ctx.quadraticCurveTo(10, -155, 4, -170);
  ctx.stroke();

  // Fronds
  const fronds = [
    [-95, -40],
    [-70, -95],
    [-20, -130],
    [40, -125],
    [85, -80],
    [95, -30],
  ] as const;
  for (const [fx, fy] of fronds) {
    ctx.beginPath();
    ctx.moveTo(4, -168);
    ctx.quadraticCurveTo(fx * 0.35, -168 + fy * 0.35, fx, -168 + fy);
    ctx.quadraticCurveTo(fx * 0.55, -150, 4, -168);
    ctx.fill();
  }
  ctx.restore();
}

/** Ocean wave band across the card width. */
export function drawWaves(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  color: string = BRAND.pink,
  amp = 10,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.55;

  for (let row = 0; row < 3; row++) {
    const yy = y + row * 14;
    const phase = row * 0.9;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = x + t * w;
      const py = yy + Math.sin(t * Math.PI * 4 + phase) * amp;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** Soft sand speckles. */
export function drawSandDots(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  count = 40,
) {
  ctx.save();
  ctx.fillStyle = "rgba(11,104,57,0.12)";
  for (let i = 0; i < count; i++) {
    // deterministic-ish scatter from index
    const px = x + ((i * 97) % w);
    const py = y + ((i * 53) % h);
    const r = 1.2 + (i % 3);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Small hibiscus-like flower accent. */
export function drawFlower(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string = BRAND.pink,
) {
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const px = cx + Math.cos(a) * r * 0.55;
    const py = cy + Math.sin(a) * r * 0.55;
    ctx.beginPath();
    ctx.ellipse(px, py, r * 0.42, r * 0.28, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = BRAND.accent;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
