import { BRAND, EVENT, generateBuilderTitle } from "./brand";
import {
  brandFonts,
  canvasToBlob,
  drawCover,
  fillRoundRect,
  loadImage,
  waitForFonts,
  wrapText,
} from "./canvas";

export type IdCardInput = {
  photo: CanvasImageSource;
  name: string;
  stack: string;
  builderTitle?: string;
};

const W = 1080;
const H = 1350;

export async function generateIdCard(input: IdCardInput): Promise<Blob> {
  await waitForFonts();

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");

  const title =
    input.builderTitle?.trim() ||
    generateBuilderTitle(`${input.name}|${input.stack}`);
  const { display, mono } = brandFonts();

  // Background — deep green with soft sunrise wash
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, BRAND.primaryDark);
  bg.addColorStop(0.45, BRAND.primary);
  bg.addColorStop(1, "#096033");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  try {
    const sunrise = await loadImage("/brand/sunrise_bg.jpg");
    ctx.save();
    ctx.globalAlpha = 0.22;
    drawCover(ctx, sunrise, 0, 0, W, H);
    ctx.restore();
  } catch {
    // optional decorative layer
  }

  // Soft yellow glow
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.18, 40, W * 0.5, H * 0.18, 420);
  glow.addColorStop(0, "rgba(254,225,1,0.35)");
  glow.addColorStop(1, "rgba(254,225,1,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Card body
  const pad = 56;
  const cardX = pad;
  const cardY = pad + 28;
  const cardW = W - pad * 2;
  const cardH = H - pad * 2 - 48;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 14;
  fillRoundRect(ctx, cardX, cardY, cardW, cardH, 28, BRAND.offwhite);
  ctx.restore();

  // Top brand strip
  fillRoundRect(ctx, cardX, cardY, cardW, 118, 28, BRAND.primary);
  ctx.fillStyle = BRAND.primary;
  ctx.fillRect(cardX, cardY + 70, cardW, 48);

  ctx.fillStyle = BRAND.accent;
  ctx.font = `800 22px ${mono}`;
  ctx.textAlign = "left";
  ctx.fillText("BUILDER PASS · 2026", cardX + 40, cardY + 48);

  ctx.fillStyle = BRAND.white;
  ctx.font = `700 52px ${display}`;
  ctx.fillText(EVENT.full, cardX + 40, cardY + 100);

  // Accent tick
  ctx.fillStyle = BRAND.pink;
  ctx.fillRect(cardX + cardW - 120, cardY + 36, 64, 10);

  // Photo circle
  const photoSize = 420;
  const photoX = W / 2 - photoSize / 2;
  const photoY = cardY + 168;

  // Outer dashed pink ring
  ctx.save();
  ctx.beginPath();
  ctx.setLineDash([14, 12]);
  ctx.lineWidth = 5;
  ctx.strokeStyle = BRAND.pink;
  ctx.arc(W / 2, photoY + photoSize / 2, photoSize / 2 + 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Yellow ring
  ctx.beginPath();
  ctx.lineWidth = 10;
  ctx.strokeStyle = BRAND.accent;
  ctx.arc(W / 2, photoY + photoSize / 2, photoSize / 2 + 6, 0, Math.PI * 2);
  ctx.stroke();

  // Clip photo
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  drawCover(ctx, input.photo, photoX, photoY, photoSize, photoSize);
  ctx.restore();

  // Name
  const name = (input.name || "ANONYMOUS BUILDER").toUpperCase();
  ctx.fillStyle = BRAND.primary;
  ctx.textAlign = "center";
  ctx.font = `700 72px ${display}`;
  const nameLines = wrapText(ctx, name, cardW - 80);
  let textY = photoY + photoSize + 88;
  for (const line of nameLines.slice(0, 2)) {
    ctx.fillText(line, W / 2, textY);
    textY += 70;
  }

  // Stack / role
  const stack = (input.stack || "FULL-STACK").toUpperCase();
  ctx.fillStyle = BRAND.pink;
  ctx.font = `700 26px ${mono}`;
  ctx.fillText(stack, W / 2, textY + 12);

  // Builder class badge
  const badgeY = textY + 56;
  const badgeW = cardW - 80;
  const badgeX = cardX + 40;
  ctx.font = `700 42px ${display}`;
  const titleLines = wrapText(ctx, title.toUpperCase(), badgeW - 72).slice(0, 2);
  const badgeH = titleLines.length > 1 ? 148 : 120;
  fillRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 18, BRAND.primary);

  ctx.fillStyle = BRAND.accent;
  ctx.font = `800 18px ${mono}`;
  ctx.textAlign = "left";
  ctx.fillText("ASSIGNED BUILDER CLASS", badgeX + 36, badgeY + 40);

  ctx.fillStyle = BRAND.white;
  ctx.font = `700 42px ${display}`;
  let ty = badgeY + 82;
  for (const line of titleLines) {
    ctx.fillText(line, badgeX + 36, ty);
    ty += 40;
  }

  // Footer meta
  const footY = cardY + cardH - 52;
  ctx.fillStyle = BRAND.primary;
  ctx.font = `700 20px ${mono}`;
  ctx.textAlign = "left";
  ctx.fillText(EVENT.place, cardX + 40, footY);
  ctx.textAlign = "right";
  ctx.fillText(EVENT.dates, cardX + cardW - 40, footY);

  // Pink underline rule
  ctx.strokeStyle = BRAND.pink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cardX + 40, footY - 28);
  ctx.lineTo(cardX + cardW - 40, footY - 28);
  ctx.stroke();

  // Outer hashtag strip
  ctx.fillStyle = BRAND.accent;
  ctx.font = `800 22px ${mono}`;
  ctx.textAlign = "center";
  ctx.fillText(`${EVENT.hashtag}  ·  ${EVENT.studio}`, W / 2, H - 28);

  return canvasToBlob(canvas, "image/png");
}

export async function generatePfpFrame(photo: CanvasImageSource): Promise<Blob> {
  await waitForFonts();
  const { display, mono } = brandFonts();

  const size = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");

  // Outer frame fill
  ctx.fillStyle = BRAND.primary;
  ctx.fillRect(0, 0, size, size);

  // Yellow inner border band
  const outer = 54;
  const mid = 18;
  ctx.fillStyle = BRAND.accent;
  ctx.fillRect(outer - mid, outer - mid, size - (outer - mid) * 2, size - (outer - mid) * 2);

  // Photo well
  const inset = outer;
  ctx.fillStyle = BRAND.black;
  ctx.fillRect(inset, inset, size - inset * 2, size - inset * 2);
  drawCover(ctx, photo, inset, inset, size - inset * 2, size - inset * 2);

  // Pink corner brackets
  const c = 70;
  const t = 10;
  ctx.strokeStyle = BRAND.pink;
  ctx.lineWidth = t;
  ctx.lineCap = "square";
  const corners: Array<[number, number, number, number, number, number]> = [
    [inset + 18, inset + 18 + c, inset + 18, inset + 18, inset + 18 + c, inset + 18],
    [size - inset - 18 - c, inset + 18, size - inset - 18, inset + 18, size - inset - 18, inset + 18 + c],
    [inset + 18, size - inset - 18 - c, inset + 18, size - inset - 18, inset + 18 + c, size - inset - 18],
    [
      size - inset - 18 - c,
      size - inset - 18,
      size - inset - 18,
      size - inset - 18,
      size - inset - 18,
      size - inset - 18 - c,
    ],
  ];
  for (const [x1, y1, x2, y2, x3, y3] of corners) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();
  }

  // Bottom brand banner overlay
  const bannerH = 132;
  const bannerY = size - inset - bannerH;
  ctx.fillStyle = "rgba(11,104,57,0.92)";
  ctx.fillRect(inset, bannerY, size - inset * 2, bannerH);

  ctx.fillStyle = BRAND.accent;
  ctx.fillRect(inset, bannerY, size - inset * 2, 8);

  ctx.fillStyle = BRAND.white;
  ctx.textAlign = "center";
  ctx.font = `700 56px ${display}`;
  ctx.fillText("HACKER HOUSE GOA 2026", size / 2, bannerY + 62);

  ctx.fillStyle = BRAND.accent;
  ctx.font = `800 22px ${mono}`;
  ctx.fillText(`${EVENT.place}  ·  ${EVENT.hashtag}`, size / 2, bannerY + 102);

  // Top mini label
  fillRoundRect(ctx, size / 2 - 150, inset + 22, 300, 44, 22, BRAND.pink);
  ctx.fillStyle = BRAND.white;
  ctx.font = `800 18px ${mono}`;
  ctx.fillText("OFFICIAL PFP FRAME", size / 2, inset + 50);

  return canvasToBlob(canvas, "image/png");
}
