import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { updateProject } from "@/lib/server-fns";
import {
  DEFAULT_FILTERS,
  DEFAULT_GRID,
  DEFAULT_TRANSFORM,
  normalizeExport,
  normalizeFilters,
  normalizeGrid,
  normalizeTransform,
} from "./defaults";

const toSettings = (project) => ({
  name: project.name || "Sans titre",
  image_file_uri: project.image_file_uri || "",
  image_name: project.image_name || "",
  image_width: project.image_width || 0,
  image_height: project.image_height || 0,
  transform: normalizeTransform(project.transform),
  filters: normalizeFilters(project.filters),
  grid: normalizeGrid(project.grid),
  export_settings: normalizeExport(project.export_settings),
});

/** État de l'éditeur + sauvegarde automatique (débounce) sur le projet. */
export function useProjectEditor(project) {
  const [settings, setSettings] = useState(() => toSettings(project));
  const [status, setStatus] = useState("idle");
  const [historySize, setHistorySize] = useState(0);
  const historyRef = useRef([]);
  const latest = useRef(settings);
  latest.current = settings;
  const save = useServerFn(updateProject);
  const saveRef = useRef(save);
  saveRef.current = save;
  const skipSave = useRef(true);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return undefined;
    }
    setStatus("saving");
    const timer = setTimeout(async () => {
      try {
        const payload = { ...latest.current, name: latest.current.name.trim() || "Sans titre" };
        await saveRef.current({ data: { id: project.id, ...payload } });
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [settings, project.id]);

  const pushHistory = useCallback(() => {
    historyRef.current.push(latest.current.transform);
    if (historyRef.current.length > 25) historyRef.current.shift();
    setHistorySize(historyRef.current.length);
  }, []);

  const setTransform = useCallback(
    (next, options = {}) => {
      if (options.record !== false) pushHistory();
      setSettings((current) => ({
        ...current,
        transform: typeof next === "function" ? next(current.transform) : next,
      }));
    },
    [pushHistory],
  );

  const undoTransform = useCallback(() => {
    const previous = historyRef.current.pop();
    setHistorySize(historyRef.current.length);
    if (previous) setSettings((current) => ({ ...current, transform: previous }));
  }, []);

  const resetTransform = useCallback(() => {
    historyRef.current = [];
    setHistorySize(0);
    setSettings((current) => ({ ...current, transform: { ...DEFAULT_TRANSFORM, crop: { ...DEFAULT_TRANSFORM.crop } } }));
  }, []);

  const patchGrid = useCallback((patch) => {
    setSettings((current) => ({ ...current, grid: { ...current.grid, ...patch } }));
  }, []);

  const resetGrid = useCallback(() => {
    setSettings((current) => ({ ...current, grid: { ...DEFAULT_GRID } }));
  }, []);

  const patchFilters = useCallback((patch) => {
    setSettings((current) => ({ ...current, filters: { ...current.filters, ...patch } }));
  }, []);

  const resetFilters = useCallback(() => {
    setSettings((current) => ({ ...current, filters: { ...DEFAULT_FILTERS } }));
  }, []);

  const rename = useCallback((name) => {
    setSettings((current) => ({ ...current, name }));
  }, []);

  const replaceImage = useCallback(({ fileUri, fileName, width, height }) => {
    historyRef.current = [];
    setHistorySize(0);
    setSettings((current) => ({
      ...current,
      image_file_uri: fileUri,
      image_name: fileName,
      image_width: width,
      image_height: height,
      transform: { ...DEFAULT_TRANSFORM, crop: { ...DEFAULT_TRANSFORM.crop } },
    }));
  }, []);

  return {
    settings,
    status,
    canUndo: historySize > 0,
    setTransform,
    undoTransform,
    resetTransform,
    patchGrid,
    resetGrid,
    patchFilters,
    resetFilters,
    rename,
    replaceImage,
  };
}