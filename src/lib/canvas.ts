/** Draw an image cover-cropped into a destination rect. */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const iw =
    "naturalWidth" in img && (img as HTMLImageElement).naturalWidth
      ? (img as HTMLImageElement).naturalWidth
      : (img as HTMLImageElement).width || (img as ImageBitmap).width || (img as HTMLCanvasElement).width || 0;
  const ih =
    "naturalHeight" in img && (img as HTMLImageElement).naturalHeight
      ? (img as HTMLImageElement).naturalHeight
      : (img as HTMLImageElement).height || (img as ImageBitmap).height || (img as HTMLCanvasElement).height || 0;

  if (!iw || !ih) return;

  const scale = Math.max(dw / iw, dh / ih);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  stroke: string,
  width: number,
) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

// B4: Polyfill ctx.roundRect for Firefox <112, Chrome Android <105, Samsung Internet <21
if (
  typeof CanvasRenderingContext2D !== "undefined" &&
  !CanvasRenderingContext2D.prototype.roundRect
) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number | number[] = 0,
  ) {
    const radius = Array.isArray(r) ? (r[0] ?? 0) : r;
    roundRectPath(this, x, y, w, h, Number(radius));
    return this;
  };
}

export async function waitForFonts() {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }
}

/** Resolved display + mono stacks for canvas text. */
export function brandFonts() {
  const root =
    typeof document !== "undefined"
      ? getComputedStyle(document.documentElement)
      : null;
  const display =
    root?.getPropertyValue("--font-display").trim() ||
    "Imbue, Georgia, serif";
  const mono = '"Victor Mono", ui-monospace, monospace';
  return { display, mono };
}

// B14: Module-level image cache — brand assets loaded once, reused on every card generation
const imageCache = new Map<string, HTMLImageElement>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// B15: Downscale large photos before canvas draw to prevent slow render on mobile
export function downscalePhoto(
  img: CanvasImageSource,
  maxDim = 1200,
): CanvasImageSource {
  if (typeof document === "undefined") return img;
  const iw =
    "naturalWidth" in img && (img as HTMLImageElement).naturalWidth
      ? (img as HTMLImageElement).naturalWidth
      : (img as HTMLImageElement).width || (img as ImageBitmap).width || (img as HTMLCanvasElement).width || 0;
  const ih =
    "naturalHeight" in img && (img as HTMLImageElement).naturalHeight
      ? (img as HTMLImageElement).naturalHeight
      : (img as HTMLImageElement).height || (img as ImageBitmap).height || (img as HTMLCanvasElement).height || 0;

  if (!iw || !ih || (iw <= maxDim && ih <= maxDim)) return img;

  const scale = Math.min(maxDim / iw, maxDim / ih);
  const dw = Math.round(iw * scale);
  const dh = Math.round(ih * scale);

  const off = document.createElement("canvas");
  off.width = dw;
  off.height = dh;
  const octx = off.getContext("2d");
  if (!octx) return img;
  octx.drawImage(img, 0, 0, dw, dh);
  return off;
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = "image/png",
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Failed to export canvas"));
        else resolve(blob);
      },
      type,
      quality,
    );
  });
}

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let line = words[0];
  for (let i = 1; i < words.length; i++) {
    const test = `${line} ${words[i]}`;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      lines.push(line);
      line = words[i];
    }
  }
  lines.push(line);
  return lines;
}

