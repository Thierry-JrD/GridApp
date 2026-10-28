import { useCallback, useEffect, useRef, useState } from "react";
import { Lock, Maximize2, Minimize2, Move, Unlock, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MIN_FIT_RATIO = 0.15;
const MAX_FIT_RATIO = 12;

export default function EditorCanvas({ artwork, locked, onToggleLock, className }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pointers = useRef(new Map());
  const gesture = useRef({ mode: null, lastX: 0, lastY: 0, distance: 0, lastDistance: 0 });
  const fittedKey = useRef("");
  const touched = useRef(false);

  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(() => {
      setBox({ width: element.clientWidth, height: element.clientHeight });
    });
    observer.observe(element);
    setBox({ width: element.clientWidth, height: element.clientHeight });
    const onFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      observer.disconnect();
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, []);

  const fitScale = useCallback(() => {
    if (!artwork || !box.width || !box.height) return 1;
    return Math.min((box.width - 56) / artwork.width, (box.height - 56) / artwork.height);
  }, [artwork, box]);

  const fit = useCallback(() => {
    if (!artwork || !box.width) return;
    touched.current = false;
    const scale = fitScale();
    setView({
      scale,
      x: (box.width - artwork.width * scale) / 2,
      y: (box.height - artwork.height * scale) / 2,
    });
  }, [artwork, box, fitScale]);

  // Recadre la vue quand l'image change, et tant que l'utilisateur n'a pas
  // lui-même zoomé ou déplacé la vue (rotation d'écran, panneaux, plein écran).
  useEffect(() => {
    if (!artwork || !box.width) return;
    const key = `${artwork.width}x${artwork.height}`;
    if (fittedKey.current !== key) {
      fittedKey.current = key;
      touched.current = false;
      fit();
      return;
    }
    if (!touched.current) fit();
  }, [artwork, box.width, box.height, fit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !box.width) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(box.width * ratio);
    canvas.height = Math.round(box.height * ratio);
    canvas.style.width = `${box.width}px`;
    canvas.style.height = `${box.height}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, box.width, box.height);
    if (!artwork) return;
    const width = artwork.width * view.scale;
    const height = artwork.height * view.scale;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(view.x, view.y, width, height);
    ctx.restore();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(artwork, view.x, view.y, width, height);
    ctx.strokeStyle = "rgba(127,127,127,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(view.x + 0.5, view.y + 0.5, width - 1, height - 1);
  }, [artwork, view, box]);

  const zoomAt = useCallback(
    (clientX, clientY, factor) => {
      const element = wrapRef.current;
      if (!element || !artwork) return;
      const rect = element.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      touched.current = true;
      const base = fitScale();
      setView((current) => {
        const nextScale = Math.min(base * MAX_FIT_RATIO, Math.max(base * MIN_FIT_RATIO, current.scale * factor));
        if (current.scale === 0) return current;
        const ratio = nextScale / current.scale;
        return {
          scale: nextScale,
          x: px - (px - current.x) * ratio,
          y: py - (py - current.y) * ratio,
        };
      });
    },
    [artwork, fitScale],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const onWheel = (event) => {
      event.preventDefault();
      zoomAt(event.clientX, event.clientY, Math.exp(-event.deltaY * 0.0015));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const handlePointerDown = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = {
        mode: "pinch",
        lastDistance: Math.hypot(a.x - b.x, a.y - b.y),
      };
    } else {
      gesture.current = { mode: "pan", lastX: event.clientX, lastY: event.clientY };
    }
  };

  const handlePointerMove = (event) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const gestureState = gesture.current;

    if (pointers.current.size >= 2 && gestureState.mode === "pinch") {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (gestureState.lastDistance > 0 && distance > 0) {
        zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, distance / gestureState.lastDistance);
      }
      gestureState.lastDistance = distance;
      return;
    }

    if (gestureState.mode === "pan" && !locked) {
      touched.current = true;
      const dx = event.clientX - gestureState.lastX;
      const dy = event.clientY - gestureState.lastY;
      gestureState.lastX = event.clientX;
      gestureState.lastY = event.clientY;
      setView((current) => ({ ...current, x: current.x + dx, y: current.y + dy }));
    }
  };

  const handlePointerUp = (event) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 0) {
      gesture.current = { mode: null };
    } else if (pointers.current.size === 1) {
      const [remaining] = [...pointers.current.values()];
      gesture.current = { mode: "pan", lastX: remaining.x, lastY: remaining.y };
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await wrapRef.current?.requestFullscreen();
    } catch {
      toast.error("Le plein écran n'est pas disponible dans ce navigateur.");
    }
  };

  const zoomBy = (factor) => {
    const element = wrapRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  };

  const fitPercent = Math.round((view.scale / (fitScale() || 1)) * 100);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative h-full w-full overflow-hidden bg-workspace [&:fullscreen]:bg-workspace",
        locked ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        className="block touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      <div className="no-print pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3">
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-border/80 bg-card/90 p-1 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => zoomBy(1 / 1.25)}
            aria-label="Zoom arrière"
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={fit}
            title="Ajuster à la vue"
            className="min-w-[58px] rounded-full px-2 py-1 font-mono text-[11px] tabular-nums text-foreground transition-colors hover:bg-secondary"
          >
            {fitPercent}%
          </button>
          <button
            type="button"
            onClick={() => zoomBy(1.25)}
            aria-label="Zoom avant"
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="mx-0.5 h-5 w-px bg-border" />
          <button
            type="button"
            onClick={fit}
            aria-label="Réinitialiser la vue"
            title="Réinitialiser le zoom et la position"
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Move className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onToggleLock?.(!locked)}
            aria-label={locked ? "Déverrouiller la position" : "Verrouiller la position"}
            title={locked ? "Position verrouillée" : "Verrouiller la position"}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-secondary",
              locked ? "text-brand" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Plein écran"
            title="Plein écran"
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}