import { base44 } from "@/api/base44Client";
import { getAccessToken } from "@base44/sdk";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPT_ATTRIBUTE = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 18 * 1024 * 1024;

export function validateImageFile(file) {
  if (!file) return "Aucun fichier sélectionné.";
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Format non pris en charge. Choisissez un fichier JPEG, PNG ou WebP.";
  }
  if (file.size > MAX_BYTES) return "Cette image est trop lourde (18 Mo maximum).";
  return null;
}

export function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const size = { width: image.naturalWidth, height: image.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(size);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Cette image ne peut pas être lue par le navigateur."));
    };
    image.src = url;
  });
}

export async function uploadProjectImage(file) {
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  return file_uri;
}

/**
 * Les fichiers étant privés, l'image passe par une route interne qui vérifie
 * que le visiteur possède bien le projet, puis renvoie les octets : le canvas
 * reste non « tainté » et l'export fonctionne.
 */
export async function loadImageFromUri(uri) {
  let token = null;
  try {
    token = getAccessToken();
  } catch {
    token = null;
  }
  const response = await fetch(`/api/media?uri=${encodeURIComponent(uri)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error("Impossible de charger l'image de ce projet.");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("Cette image ne peut pas être affichée."));
      image.src = objectUrl;
    });
    return { image, objectUrl };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export function canvasToBlob(canvas, type = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Le fichier n'a pas pu être généré."))),
      type,
      quality,
    );
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function safeFileName(name, extension) {
  const base = (name || "gridart")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return `${base || "gridart"}.${extension}`;
}