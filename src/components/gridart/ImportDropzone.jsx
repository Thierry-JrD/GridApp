import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCEPT_ATTRIBUTE } from "@/lib/gridart/image";
import { cn } from "@/lib/utils";

export default function ImportDropzone({ onFile, busy, error, compact }) {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const pick = (event) => {
    const file = event.target.files?.[0];
    if (file) onFile(file);
    event.target.value = "";
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-2xl border border-dashed text-center transition-colors",
        compact ? "gap-3 px-5 py-7" : "gap-4 px-6 py-12",
        dragging ? "border-brand bg-brand/[0.06]" : "border-border bg-card/40",
      )}
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl border border-border/80 bg-secondary/60">
        {busy ? <Loader2 className="h-5 w-5 animate-spin text-brand" /> : <ImagePlus className="h-5 w-5 text-brand" />}
      </div>

      <div className="space-y-1">
        <p className="font-display text-lg tracking-tight">
          {busy ? "Importation en cours…" : "Déposez une image ici"}
        </p>
        <p className="text-[11.5px] text-muted-foreground">
          JPEG, PNG ou WebP · 18 Mo maximum · l'original est conservé intact
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={() => fileRef.current?.click()} disabled={busy} className="gap-2">
          <Upload className="h-4 w-4" />
          Importer une image
        </Button>
        <Button
          variant="outline"
          onClick={() => cameraRef.current?.click()}
          disabled={busy}
          className="gap-2"
          title="Ouvre l'appareil photo sur les appareils compatibles"
        >
          <Camera className="h-4 w-4" />
          Prendre une photo
        </Button>
      </div>

      {error && (
        <p role="alert" className="max-w-md rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[11.5px] text-destructive">
          {error}
        </p>
      )}

      <input ref={fileRef} type="file" accept={ACCEPT_ATTRIBUTE} className="hidden" onChange={pick} />
      <input
        ref={cameraRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        capture="environment"
        className="hidden"
        onChange={pick}
      />
    </div>
  );
}