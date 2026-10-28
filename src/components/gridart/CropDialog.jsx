import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { clamp } from "@/lib/gridart/defaults";

const HANDLES = [
  { mode: "nw", className: "-left-1.5 -top-1.5 cursor-nwse-resize" },
  { mode: "ne", className: "-right-1.5 -top-1.5 cursor-nesw-resize" },
  { mode: "sw", className: "-left-1.5 -bottom-1.5 cursor-nesw-resize" },
  { mode: "se", className: "-right-1.5 -bottom-1.5 cursor-nwse-resize" },
];

export default function CropDialog({ open, onOpenChange, image, objectUrl, crop, onApply }) {
  const wrapRef = useRef(null);
  const drag = useRef(null);
  const [rect, setRect] = useState(crop);
  const [displayWidth, setDisplayWidth] = useState(0);

  useEffect(() => {
    if (open) setRect(crop);
  }, [open, crop]);

  useEffect(() => {
    if (!open || !image) return undefined;
    const measure = () => {
      const element = wrapRef.current;
      if (!element) return;
      const aspect = image.naturalWidth / image.naturalHeight;
      const maxHeight = window.innerHeight * 0.52;
      let width = element.clientWidth;
      let height = width / aspect;
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspect;
      }
      setDisplayWidth(width);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open, image]);

  const startDrag = (mode) => (event) => {
    event.preventDefault();
    event.stopPropagation();
    const element = wrapRef.current;
    if (!element) return;
    drag.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      rect: { ...rect },
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleMove = (event) => {
    const state = drag.current;
    if (!state) return;
    const dx = (event.clientX - state.startX) / state.width;
    const dy = (event.clientY - state.startY) / state.height;
    const min = 0.06;
    let { x, y, w, h } = state.rect;
    if (state.mode === "move") {
      x = clamp(state.rect.x + dx, 0, 1 - state.rect.w);
      y = clamp(state.rect.y + dy, 0, 1 - state.rect.h);
    } else {
      if (state.mode.includes("w")) {
        const nextX = clamp(state.rect.x + dx, 0, state.rect.x + state.rect.w - min);
        w = state.rect.x + state.rect.w - nextX;
        x = nextX;
      }
      if (state.mode.includes("e")) w = clamp(state.rect.w + dx, min, 1 - state.rect.x);
      if (state.mode.includes("n")) {
        const nextY = clamp(state.rect.y + dy, 0, state.rect.y + state.rect.h - min);
        h = state.rect.y + state.rect.h - nextY;
        y = nextY;
      }
      if (state.mode.includes("s")) h = clamp(state.rect.h + dy, min, 1 - state.rect.y);
    }
    setRect({ x, y, w, h });
  };

  const endDrag = () => {
    drag.current = null;
  };

  const imageWidth = image?.naturalWidth || 0;
  const imageHeight = image?.naturalHeight || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Recadrer l'image</DialogTitle>
          <DialogDescription>
            Faites glisser le cadre pour choisir la zone à conserver. L'image d'origine reste intacte.
          </DialogDescription>
        </DialogHeader>

        <div ref={wrapRef} className="flex w-full justify-center">
          <div
            className="relative select-none overflow-hidden rounded-lg border border-border/60 bg-workspace touch-none"
            style={{ width: displayWidth || "100%", aspectRatio: `${imageWidth || 1} / ${imageHeight || 1}` }}
            onPointerMove={handleMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {objectUrl && (
              <img src={objectUrl} alt="Aperçu de l'image à recadrer" className="pointer-events-none h-full w-full select-none object-contain" />
            )}
            <div
              role="presentation"
              onPointerDown={startDrag("move")}
              className="absolute cursor-move border border-brand/90"
              style={{
                left: `${rect.x * 100}%`,
                top: `${rect.y * 100}%`,
                width: `${rect.w * 100}%`,
                height: `${rect.h * 100}%`,
                boxShadow: "0 0 0 9999px rgba(8,9,11,0.62)",
              }}
            >
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className="border border-white/25" />
                ))}
              </div>
              {HANDLES.map((handle) => (
                <button
                  key={handle.mode}
                  type="button"
                  aria-label={`Poignée ${handle.mode}`}
                  onPointerDown={startDrag(handle.mode)}
                  className={`absolute h-3.5 w-3.5 rounded-sm border-2 border-background bg-brand ${handle.className}`}
                />
              ))}
            </div>
          </div>
        </div>

        <p className="text-center font-mono text-[11px] text-muted-foreground">
          {Math.round(rect.w * imageWidth)} × {Math.round(rect.h * imageHeight)} px conservés
        </p>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => setRect({ x: 0, y: 0, w: 1, h: 1 })}>
            Tout l'image
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              onApply(rect);
              onOpenChange(false);
            }}
          >
            Appliquer le recadrage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}