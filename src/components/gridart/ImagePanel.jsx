import { useEffect, useRef, useState } from "react";
import { Crop, FlipHorizontal, FlipVertical, ImageUp, RotateCcw, RotateCw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { NumberField, PanelSection } from "@/components/gridart/fields";
import { ACCEPT_ATTRIBUTE } from "@/lib/gridart/image";
import { outputSize } from "@/lib/gridart/render";

function ActionButton({ icon: Icon, label, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-lg border px-1.5 py-2 text-[10.5px] transition-colors ${
        active
          ? "border-brand/60 bg-brand/10 text-foreground"
          : "border-border/60 bg-secondary/30 text-muted-foreground hover:border-border hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export default function ImagePanel({
  image,
  imageName,
  transform,
  onTransform,
  onReset,
  onUndo,
  canUndo,
  onOpenCrop,
  onReplaceFile,
}) {
  const output = image ? outputSize(transform, image.naturalWidth, image.naturalHeight) : { width: 0, height: 0 };
  const [width, setWidth] = useState(output.width);
  const [height, setHeight] = useState(output.height);
  const [keepRatio, setKeepRatio] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    setWidth(output.width);
    setHeight(output.height);
  }, [output.width, output.height]);

  const aspect = output.height ? output.width / output.height : 1;

  const rotateBy = (delta) => {
    const rotate = (((transform.rotate + delta) % 360) + 360) % 360;
    const next = { ...transform, rotate };
    if (transform.outWidth && transform.outHeight) {
      next.outWidth = transform.outHeight;
      next.outHeight = transform.outWidth;
    }
    onTransform(next);
  };

  const changeWidth = (value) => {
    setWidth(value);
    if (keepRatio) setHeight(Math.max(1, Math.round(value / aspect)));
  };

  const changeHeight = (value) => {
    setHeight(value);
    if (keepRatio) setWidth(Math.max(1, Math.round(value * aspect)));
  };

  return (
    <div className="space-y-4">
      <PanelSection title="Image d'origine" description="Le fichier importé n'est jamais modifié.">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-secondary/30 px-2.5 py-2">
          <div className="min-w-0">
            <p className="truncate text-[11.5px] font-medium">{imageName || "Image importée"}</p>
            <p className="font-mono text-[10.5px] text-muted-foreground">
              {image ? `${image.naturalWidth} × ${image.naturalHeight} px` : "chargement…"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="shrink-0 rounded-md border border-border px-2 py-1 text-[10.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Remplacer
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onReplaceFile(file);
              event.target.value = "";
            }}
          />
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          <ActionButton icon={RotateCw} label="Droite" onClick={() => rotateBy(90)} />
          <ActionButton icon={RotateCcw} label="Gauche" onClick={() => rotateBy(-90)} />
          <ActionButton
            icon={FlipHorizontal}
            label="Miroir H"
            active={transform.flipH}
            onClick={() => onTransform({ ...transform, flipH: !transform.flipH })}
          />
          <ActionButton
            icon={FlipVertical}
            label="Miroir V"
            active={transform.flipV}
            onClick={() => onTransform({ ...transform, flipV: !transform.flipV })}
          />
          <ActionButton icon={Crop} label="Recadrer" onClick={onOpenCrop} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => inputRef.current?.click()}>
            <ImageUp className="h-3.5 w-3.5" />
            Remplacer
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled={!canUndo} onClick={onUndo}>
            <Undo2 className="h-3.5 w-3.5" />
            Annuler
          </Button>
        </div>
      </PanelSection>

      <PanelSection title="Dimensions de sortie" description="Recadrage, orientation et taille finale de l'image de travail.">
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-2">
          <span className="text-[11px] text-muted-foreground">Conserver les proportions</span>
          <Switch checked={keepRatio} onCheckedChange={setKeepRatio} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Largeur" value={width} min={64} max={8000} suffix="px" onChange={changeWidth} />
          <NumberField label="Hauteur" value={height} min={64} max={8000} suffix="px" onChange={changeHeight} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            className="text-xs"
            onClick={() => onTransform({ ...transform, outWidth: Math.max(1, width), outHeight: Math.max(1, height) })}
          >
            Appliquer
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onTransform({ ...transform, outWidth: null, outHeight: null })}
          >
            Taille d'origine
          </Button>
        </div>
        <p className="rounded-lg bg-secondary/40 px-2.5 py-2 text-[10.5px] leading-relaxed text-muted-foreground">
          Sortie actuelle : <span className="font-mono">{output.width} × {output.height} px</span>
          {transform.crop.w < 1 || transform.crop.h < 1 ? " (recadrée)" : ""}
        </p>
      </PanelSection>

      <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={onReset}>
        <RotateCcw className="h-3.5 w-3.5" />
        Réinitialiser toutes les retouches
      </Button>
    </div>
  );
}