import { clamp, normalizeFilters, normalizeGrid, normalizeTransform } from "./defaults";

const createCanvas = (width, height) => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
};

export function outputSize(transform, imageWidth, imageHeight) {
  const t = normalizeTransform(transform);
  const cropWidth = Math.max(1, Math.round(t.crop.w * imageWidth));
  const cropHeight = Math.max(1, Math.round(t.crop.h * imageHeight));
  const swapped = ((t.rotate % 360) + 360) % 360 % 180 !== 0;
  let width = swapped ? cropHeight : cropWidth;
  let height = swapped ? cropWidth : cropHeight;
  if (t.outWidth && t.outHeight) {
    width = Math.max(1, Math.round(t.outWidth));
    height = Math.max(1, Math.round(t.outHeight));
  }
  return { width, height };
}

export function cssFilterString(filters) {
  const f = normalizeFilters(filters);
  const parts = [];
  if (f.brightness !== 100) parts.push(`brightness(${f.brightness / 100})`);
  if (f.contrast !== 100) parts.push(`contrast(${f.contrast / 100})`);
  if (f.saturation !== 100) parts.push(`saturate(${f.saturation / 100})`);
  if (f.grayscale) parts.push("grayscale(1)");
  return parts.length ? parts.join(" ") : "none";
}

function applyEdges(canvas, amount) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const gray = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  const out = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const a = gray[i - width - 1];
      const b = gray[i - width];
      const c = gray[i - width + 1];
      const d = gray[i - 1];
      const e = gray[i + 1];
      const f = gray[i + width - 1];
      const g = gray[i + width];
      const h = gray[i + width + 1];
      const gx = -a + c - 2 * d + 2 * e - f + h;
      const gy = -a - 2 * b - c + f + 2 * g + h;
      const magnitude = Math.min(255, Math.sqrt(gx * gx + gy * gy));
      const edge = 255 - magnitude;
      const o = i * 4;
      out[o] = data[o] * (1 - amount) + edge * amount;
      out[o + 1] = data[o + 1] * (1 - amount) + edge * amount;
      out[o + 2] = data[o + 2] * (1 - amount) + edge * amount;
    }
  }
  imageData.data.set(out);
  ctx.putImageData(imageData, 0, 0);
}

function applySketch(canvas, amount) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const { width, height } = canvas;
  const base = ctx.getImageData(0, 0, width, height);
  const data = base.data;

  const blurCanvas = createCanvas(width, height);
  const blurCtx = blurCanvas.getContext("2d", { willReadFrequently: true });
  const radius = Math.max(2, Math.round(Math.max(width, height) / 170));
  blurCtx.filter = `grayscale(1) invert(1) blur(${radius}px)`;
  blurCtx.drawImage(canvas, 0, 0);
  blurCtx.filter = "none";
  const blurred = blurCtx.getImageData(0, 0, width, height).data;

  for (let i = 0; i < data.length; i += 4) {
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const blend = 255 - blurred[i];
    const dodge = blend >= 255 ? 255 : Math.min(255, (luminance * 255) / (256 - blend));
    data[i] = data[i] * (1 - amount) + dodge * amount;
    data[i + 1] = data[i + 1] * (1 - amount) + dodge * amount;
    data[i + 2] = data[i + 2] * (1 - amount) + dodge * amount;
  }
  ctx.putImageData(base, 0, 0);
}

/**
 * Aplatit recadrage, rotation, miroirs et filtres dans un canvas de travail.
 * L'image importée n'est jamais modifiée.
 */
export function buildBase(image, transform, filters, maxDim = 1500) {
  if (!image) return null;
  const t = normalizeTransform(transform);
  const f = normalizeFilters(filters);
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const out = outputSize(t, imageWidth, imageHeight);
  const scale = Math.min(1, maxDim / Math.max(out.width, out.height));
  const width = Math.max(1, Math.round(out.width * scale));
  const height = Math.max(1, Math.round(out.height * scale));

  const sourceX = Math.round(t.crop.x * imageWidth);
  const sourceY = Math.round(t.crop.y * imageHeight);
  const sourceW = Math.max(1, Math.round(t.crop.w * imageWidth));
  const sourceH = Math.max(1, Math.round(t.crop.h * imageHeight));

  const rotation = ((Math.round(t.rotate) % 360) + 360) % 360;
  const swapped = rotation === 90 || rotation === 270;
  const flatWidth = swapped ? height : width;
  const flatHeight = swapped ? width : height;

  const flat = createCanvas(flatWidth, flatHeight);
  const flatCtx = flat.getContext("2d");
  flatCtx.imageSmoothingEnabled = true;
  flatCtx.imageSmoothingQuality = "high";
  flatCtx.save();
  flatCtx.translate(t.flipH ? flatWidth : 0, t.flipV ? flatHeight : 0);
  flatCtx.scale(t.flipH ? -1 : 1, t.flipV ? -1 : 1);
  flatCtx.drawImage(image, sourceX, sourceY, sourceW, sourceH, 0, 0, flatWidth, flatHeight);
  flatCtx.restore();

  const base = createCanvas(width, height);
  const ctx = base.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.filter = cssFilterString(f);
  ctx.drawImage(flat, -flatWidth / 2, -flatHeight / 2);
  ctx.restore();

  if (f.edges > 0) applyEdges(base, clamp(f.edges, 0, 100) / 100);
  if (f.sketch > 0) applySketch(base, clamp(f.sketch, 0, 100) / 100);
  return base;
}

const letters = (index) => {
  let n = index;
  let label = "";
  while (n > 0) {
    const remainder = (n - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
};

function drawCoordinates(ctx, width, height, cols, rows, grid, unit) {
  const cellW = width / cols;
  const cellH = height / rows;
  const size = Math.max(9, grid.coordSize * unit);
  ctx.save();
  ctx.font = `500 ${size}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, size / 4.5);
  ctx.strokeStyle = "rgba(10,12,14,0.7)";
  ctx.fillStyle = "#ffffff";
  const padX = Math.min(cellW * 0.22, size * 1.1);
  const padY = Math.min(cellH * 0.22, size * 1.1);
  const draw = (text, x, y) => {
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  };
  for (let i = 0; i < cols; i += 1) {
    const label = grid.coordSystem === "numbers" ? String(i + 1) : letters(i + 1);
    draw(label, i * cellW + cellW / 2, padY + size / 2);
  }
  for (let j = 0; j < rows; j += 1) {
    const label = grid.coordSystem === "letters" ? letters(j + 1) : String(j + 1);
    draw(label, padX + size / 2, j * cellH + cellH / 2);
  }
  ctx.restore();
}

export function drawGrid(ctx, width, height, gridSettings, { withCoords = true } = {}) {
  const grid = normalizeGrid(gridSettings);
  if (!grid.enabled) return;
  const cols = clamp(Math.round(grid.cols), 1, 100);
  const rows = clamp(Math.round(grid.rows), 1, 100);
  const unit = width / 1200;
  const cellW = width / cols;
  const cellH = height / rows;
  const lineWidth = Math.max(0.6, grid.thickness * unit);

  ctx.save();
  ctx.globalAlpha = clamp(grid.opacity, 0, 1);
  ctx.strokeStyle = grid.color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(grid.dashed ? [lineWidth * 3.2, lineWidth * 2.4] : []);
  ctx.beginPath();
  for (let i = 0; i <= cols; i += 1) {
    const x = i === cols ? width : i * cellW;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let j = 0; j <= rows; j += 1) {
    const y = j === rows ? height : j * cellH;
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  if (grid.diagonals) {
    for (let i = 0; i < cols; i += 1) {
      for (let j = 0; j < rows; j += 1) {
        const x = i * cellW;
        const y = j * cellH;
        ctx.moveTo(x, y);
        ctx.lineTo(x + cellW, y + cellH);
        ctx.moveTo(x + cellW, y);
        ctx.lineTo(x, y + cellH);
      }
    }
  }
  ctx.stroke();
  ctx.restore();

  if (grid.coords && withCoords) drawCoordinates(ctx, width, height, cols, rows, grid, unit);
}

export function composeArtwork(base, gridSettings, { withGrid = true, withCoords = true } = {}) {
  if (!base) return null;
  const canvas = createCanvas(base.width, base.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(base, 0, 0);
  if (withGrid) drawGrid(ctx, canvas.width, canvas.height, gridSettings, { withCoords });
  return canvas;
}

/** Rendu final à la résolution exacte demandée : c'est ce canvas qui est exporté. */
export function renderExport({
  image,
  transform,
  filters,
  grid,
  width,
  withGrid = true,
  withCoords = true,
  background = null,
}) {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const out = outputSize(transform, imageWidth, imageHeight);
  const aspect = out.width / out.height;
  const exportWidth = clamp(Math.round(width), 200, 6000);
  const exportHeight = Math.max(1, Math.round(exportWidth / aspect));
  const base = buildBase(image, transform, filters, Math.max(exportWidth, exportHeight));

  const canvas = createCanvas(exportWidth, exportHeight);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, exportWidth, exportHeight);
  }
  if (base) ctx.drawImage(base, 0, 0, exportWidth, exportHeight);
  if (withGrid) drawGrid(ctx, exportWidth, exportHeight, grid, { withCoords });
  return canvas;
}