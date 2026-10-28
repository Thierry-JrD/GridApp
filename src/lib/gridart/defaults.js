export const DEFAULT_GRID = {
  enabled: true,
  cols: 8,
  rows: 6,
  square: true,
  color: "#E4643C",
  opacity: 0.72,
  thickness: 1.5,
  dashed: false,
  diagonals: false,
  coords: false,
  coordSystem: "letters",
  coordSize: 16,
};

export const DEFAULT_FILTERS = {
  grayscale: false,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  edges: 0,
  sketch: 0,
};

export const DEFAULT_TRANSFORM = {
  crop: { x: 0, y: 0, w: 1, h: 1 },
  rotate: 0,
  flipH: false,
  flipV: false,
  outWidth: null,
  outHeight: null,
};

export const DEFAULT_EXPORT = {
  format: "png",
  width: 2000,
  quality: 0.92,
  withGrid: true,
  withCoords: true,
};

export const COLOR_SWATCHES = ["#E4643C", "#F4F1EA", "#14171A", "#2F9E8F", "#3A6EA5", "#B14A8E", "#D8B24A"];

export const clamp = (value, min, max) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export const normalizeGrid = (grid) => ({ ...DEFAULT_GRID, ...(grid || {}) });

export const normalizeFilters = (filters) => ({ ...DEFAULT_FILTERS, ...(filters || {}) });

export const normalizeTransform = (transform) => ({
  ...DEFAULT_TRANSFORM,
  ...(transform || {}),
  crop: { ...DEFAULT_TRANSFORM.crop, ...((transform && transform.crop) || {}) },
});

export const normalizeExport = (settings) => ({ ...DEFAULT_EXPORT, ...(settings || {}) });

// Rangées qui gardent des cases carrées pour un nombre de colonnes donné.
export const squareRows = (cols, width, height) => {
  if (!width || !height) return 1;
  return clamp(Math.round((cols * height) / width), 1, 100);
};

export const newProjectPayload = ({ name, fileUri, fileName, width, height, grid, exportSettings }) => ({
  name,
  image_file_uri: fileUri,
  image_name: fileName,
  image_width: width,
  image_height: height,
  transform: { ...DEFAULT_TRANSFORM },
  filters: { ...DEFAULT_FILTERS },
  grid: { ...DEFAULT_GRID, ...(grid || {}) },
  export_settings: { ...DEFAULT_EXPORT, ...(exportSettings || {}) },
});