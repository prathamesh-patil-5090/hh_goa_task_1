import { BRAND, EVENT, generateBuilderTitle } from "./brand";
import {
  brandFonts,
  canvasToBlob,
  CropAdjust,
  DEFAULT_CROP,
  downscalePhoto,
  drawCover,
  fillRoundRect,
  loadImage,
  waitForFonts,
  wrapText,
} from "./canvas";
import {
  drawBarcode,
  drawHalfSun,
  drawPalm,
  drawWaves,
} from "./goa-decor";
import { makeQrImage } from "./qr";

export type IdCardInput = {
  photo: CanvasImageSource;
  name: string;
  stack: string;
  teamName?: string;
  teamCode?: string;
  builderTitle?: string;
  crop?: CropAdjust;
  /** URL encoded into the on-card QR (tool / event link). */
  qrUrl?: string;
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
  const crop = input.crop || DEFAULT_CROP;
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
  const glow = ctx.createRadialGradient(
    W * 0.5,
    H * 0.18,
    40,
    W * 0.5,
    H * 0.18,
    420,
  );
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

  // Beach trees background texture layer
  try {
    const beachBg = await loadImage("/brand/card_beach_bg.png");
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 28);
    ctx.clip();
    ctx.globalAlpha = 0.12;
    drawCover(ctx, beachBg, cardX, cardY, cardW, cardH);
    ctx.restore();
  } catch {
    // optional decorative layer
  }

  // Top brand strip — matching HACKER HOUSE + Goa Hindi calligraphy (solid yellow) + sun icon
  const stripH = 132;
  fillRoundRect(ctx, cardX, cardY, cardW, stripH, 28, BRAND.primary);
  ctx.fillStyle = BRAND.primary;
  ctx.fillRect(cardX, cardY + 70, cardW, 62);

  ctx.fillStyle = BRAND.white;
  ctx.font = `700 52px ${display}`;
  ctx.textAlign = "left";
  ctx.fillText("HACKER HOUSE", cardX + 40, cardY + 66);

  const hhWidth = ctx.measureText("HACKER HOUSE").width;

  try {
    const goaHindiImg = await loadImage("/brand/goa_hindi_solid.svg");
    const goaH = 72;
    const goaW = (goaHindiImg.width / goaHindiImg.height) * goaH || 72;
    ctx.drawImage(
      goaHindiImg,
      cardX + 40 + hhWidth + 16,
      cardY + 2,
      goaW,
      goaH,
    );
  } catch {
    ctx.fillStyle = BRAND.accent;
    ctx.font = `700 52px ${display}`;
    ctx.fillText("गोवा", cardX + 40 + hhWidth + 16, cardY + 66);
  }

  ctx.fillStyle = BRAND.accent;
  ctx.font = `800 20px ${mono}`;
  ctx.fillText("OPEN TRIALS · OCT 28-31", cardX + 40, cardY + 104);

  try {
    const studioImg = await loadImage("/brand/2-47.svg");
    const studioH = 76;
    const studioW = (studioImg.width / studioImg.height) * studioH || 124;
    ctx.drawImage(
      studioImg,
      cardX + cardW - 40 - studioW,
      cardY + 28,
      studioW,
      studioH,
    );
  } catch {
    ctx.fillStyle = BRAND.accent;
    ctx.font = `800 20px ${mono}`;
    ctx.textAlign = "right";
    ctx.fillText("2:47 PM STUDIO", cardX + cardW - 40, cardY + 84);
  }

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

  // Clip photo (downscale first for mobile performance)
  const scaledPhoto = downscalePhoto(input.photo);
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  drawCover(ctx, scaledPhoto, photoX, photoY, photoSize, photoSize, crop);
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

  // Team Name & Team Code Barcode
  const tName = (input.teamName || "").trim().toUpperCase();
  const tCode = (input.teamCode || "").trim().toUpperCase();

  let teamOffsetY = 0;
  if (tName) {
    ctx.fillStyle = BRAND.primary;
    ctx.font = `800 22px ${mono}`;
    ctx.textAlign = "center";
    ctx.fillText(`TEAM: ${tName}`, W / 2, textY + 48);
    teamOffsetY = 38;
  }

  // Assigned builder class badge (full width)
  const badgeY = textY + 52 + teamOffsetY;
  const badgeW = cardW - 80;
  const badgeX = cardX + 40;
  ctx.font = `700 42px ${display}`;
  const titleLines = wrapText(ctx, title.toUpperCase(), badgeW - 72).slice(
    0,
    2,
  );
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

  // Team Code Barcode
  if (tCode) {
    const barY = badgeY + badgeH + 20;
    drawBarcode(ctx, W / 2, barY, 260, 48, tCode, BRAND.primary, mono);
  }

  // Footer meta
  const footY = cardY + cardH - 52;
  ctx.fillStyle = BRAND.primary;
  ctx.font = `700 20px ${mono}`;
  ctx.textAlign = "left";
  ctx.fillText(EVENT.place, cardX + 40, footY);

  ctx.fillStyle = BRAND.pink;
  ctx.font = `800 20px ${mono}`;
  ctx.textAlign = "center";
  ctx.fillText(EVENT.hashtag, W / 2, footY);

  ctx.fillStyle = BRAND.primary;
  ctx.font = `700 20px ${mono}`;
  ctx.textAlign = "right";
  ctx.fillText(EVENT.dates, cardX + cardW - 40, footY);

  // Pink underline rule
  ctx.strokeStyle = BRAND.pink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cardX + 40, footY - 28);
  ctx.lineTo(cardX + cardW - 40, footY - 28);
  ctx.stroke();

  // Outer hashtag and studio strip
  ctx.fillStyle = BRAND.accent;
  ctx.font = `800 22px ${mono}`;
  ctx.textAlign = "center";
  ctx.fillText(`${EVENT.hashtag}  ·  ${EVENT.studio}`, W / 2, H - 28);

  return canvasToBlob(canvas, "image/png");
}

export async function generatePfpFrame(
  photo: CanvasImageSource,
  crop: CropAdjust = DEFAULT_CROP,
): Promise<Blob> {
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
  ctx.fillRect(
    outer - mid,
    outer - mid,
    size - (outer - mid) * 2,
    size - (outer - mid) * 2,
  );

  // Photo well (downscale for mobile performance)
  const inset = outer;
  const scaledPfpPhoto = downscalePhoto(photo);
  ctx.fillStyle = BRAND.black;
  ctx.fillRect(inset, inset, size - inset * 2, size - inset * 2);
  drawCover(
    ctx,
    scaledPfpPhoto,
    inset,
    inset,
    size - inset * 2,
    size - inset * 2,
    crop,
  );

  // Pink corner brackets
  const c = 70;
  const t = 10;
  ctx.strokeStyle = BRAND.pink;
  ctx.lineWidth = t;
  ctx.lineCap = "square";
  const corners: Array<[number, number, number, number, number, number]> = [
    [
      inset + 18,
      inset + 18 + c,
      inset + 18,
      inset + 18,
      inset + 18 + c,
      inset + 18,
    ],
    [
      size - inset - 18 - c,
      inset + 18,
      size - inset - 18,
      inset + 18,
      size - inset - 18,
      inset + 18 + c,
    ],
    [
      inset + 18,
      size - inset - 18 - c,
      inset + 18,
      size - inset - 18,
      inset + 18 + c,
      size - inset - 18,
    ],
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
  const bannerH = 138;
  const bannerY = size - inset - bannerH;
  ctx.fillStyle = "rgba(11,104,57,0.95)";
  ctx.fillRect(inset, bannerY, size - inset * 2, bannerH);

  ctx.fillStyle = BRAND.accent;
  ctx.fillRect(inset, bannerY, size - inset * 2, 8);

  ctx.fillStyle = BRAND.white;
  ctx.textAlign = "left";
  ctx.font = `700 52px ${display}`;
  ctx.fillText("HACKER HOUSE", inset + 40, bannerY + 68);

  const hhPfpW = ctx.measureText("HACKER HOUSE").width;
  try {
    const goaHindiImg = await loadImage("/brand/goa_hindi_solid.svg");
    const goaH = 72;
    const goaW = (goaHindiImg.width / goaHindiImg.height) * goaH || 72;
    ctx.drawImage(
      goaHindiImg,
      inset + 40 + hhPfpW + 16,
      bannerY + 4,
      goaW,
      goaH,
    );
  } catch {
    ctx.fillStyle = BRAND.accent;
    ctx.font = `700 52px ${display}`;
    ctx.fillText("गोवा", inset + 40 + hhPfpW + 16, bannerY + 68);
  }

  ctx.fillStyle = BRAND.accent;
  ctx.font = `800 20px ${mono}`;
  ctx.fillText(
    `OPEN TRIALS · OCT 28-31  ·  ${EVENT.hashtag}`,
    inset + 40,
    bannerY + 110,
  );

  try {
    const studioImg = await loadImage("/brand/2-47.svg");
    const studioH = 76;
    const studioW = (studioImg.width / studioImg.height) * studioH || 124;
    ctx.drawImage(
      studioImg,
      size - inset - 40 - studioW,
      bannerY + 30,
      studioW,
      studioH,
    );
  } catch {
    ctx.fillStyle = BRAND.accent;
    ctx.font = `800 20px ${mono}`;
    ctx.textAlign = "right";
    ctx.fillText("2:47 PM STUDIO", size - inset - 40, bannerY + 88);
  }

  // Top mini label
  fillRoundRect(ctx, size / 2 - 150, inset + 22, 300, 44, 22, BRAND.pink);
  ctx.fillStyle = BRAND.white;
  ctx.font = `800 18px ${mono}`;
  ctx.textAlign = "center";
  ctx.fillText("OFFICIAL PFP FRAME", size / 2, inset + 50);

  // Tiny Goa accents on the outer yellow band
  drawHalfSun(ctx, inset - 8, inset + 8, 22, BRAND.accent);

  return canvasToBlob(canvas, "image/png");
}
