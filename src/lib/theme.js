const STORAGE_KEY = "gridart-theme";

export function storedTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme) {
  const next = theme === "light" ? "light" : "dark";
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", next === "dark");
  }
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* stockage indisponible : le thème reste appliqué pour la session */
  }
  return next;
}