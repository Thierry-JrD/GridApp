import { RotateCcw, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberField, PanelSection, SliderRow } from "@/components/gridart/fields";
import { COLOR_SWATCHES, clamp, squareRows } from "@/lib/gridart/defaults";
import { cn } from "@/lib/utils";

export default function GridPanel({ grid, onChange, onReset, size }) {
  const cols = clamp(Math.round(grid.cols), 1, 100);
  const rows = clamp(Math.round(grid.rows), 1, 100);
  const cellWidth = size.width ? Math.round(size.width / cols) : 0;
  const cellHeight = size.height ? Math.round(size.height / rows) : 0;

  const applyCols = (value) => {
    const next = clamp(Math.round(value), 1, 100);
    onChange(grid.square ? { cols: next, rows: squareRows(next, size.width, size.height) } : { cols: next });
  };

  const applyRows = (value) => {
    const next = clamp(Math.round(value), 1, 100);
    onChange(grid.square ? { rows: next, cols: squareRows(next, size.height, size.width) } : { rows: next });
  };

  const applyCellWidth = (value) => {
    const next = clamp(Math.round(size.width / Math.max(8, value)), 1, 100);
    onChange(grid.square ? { cols: next, rows: squareRows(next, size.width, size.height) } : { cols: next });
  };

  const applyCellHeight = (value) => {
    const next = clamp(Math.round(size.height / Math.max(8, value)), 1, 100);
    onChange(grid.square ? { rows: next, cols: squareRows(next, size.height, size.width) } : { rows: next });
  };

  return (
    <div className="space-y-4">
      <PanelSection
        title="Quadrillage"
        description="Il se superpose à l'image et à l'export, sans jamais la modifier."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              title="Réinitialiser le quadrillage"
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <Switch checked={grid.enabled} onCheckedChange={(value) => onChange({ enabled: value })} />
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Colonnes" value={cols} min={1} max={100} onChange={applyCols} />
          <NumberField label="Lignes" value={rows} min={1} max={100} onChange={applyRows} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Case larg." value={cellWidth} min={8} max={4000} suffix="px" onChange={applyCellWidth} />
          <NumberField label="Case haut." value={cellHeight} min={8} max={4000} suffix="px" onChange={applyCellHeight} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-2">
          <span className="text-[11px] text-muted-foreground">Cases carrées</span>
          <Switch
            checked={grid.square}
            onCheckedChange={(value) =>
              onChange({ square: value, ...(value ? { rows: squareRows(cols, size.width, size.height) } : {}) })
            }
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs"
          onClick={() => onChange({ square: true, rows: squareRows(cols, size.width, size.height) })}
        >
          <Wand2 className="h-3.5 w-3.5" />
          Ajuster aux proportions de l'image
        </Button>
      </PanelSection>

      <PanelSection title="Tracé" description="Couleur, épaisseur et style des lignes.">
        <div className="flex flex-wrap items-center gap-1.5">
          {COLOR_SWATCHES.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ color })}
              aria-label={`Couleur ${color}`}
              className={cn(
                "h-7 w-7 rounded-full border transition-transform",
                grid.color.toLowerCase() === color.toLowerCase()
                  ? "scale-110 border-foreground shadow-sm"
                  : "border-border/80 hover:scale-105",
              )}
              style={{ backgroundColor: color }}
            />
          ))}
          <label className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground">
            <input
              type="color"
              value={grid.color}
              onChange={(event) => onChange({ color: event.target.value })}
              className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
            />
            <span className="font-mono">{grid.color.toUpperCase()}</span>
          </label>
        </div>
        <SliderRow
          label="Épaisseur"
          value={grid.thickness}
          min={0.5}
          max={8}
          step={0.1}
          suffix=" px"
          onChange={(value) => onChange({ thickness: value })}
          onReset={() => onChange({ thickness: 1.5 })}
        />
        <SliderRow
          label="Transparence"
          value={Math.round(grid.opacity * 100)}
          min={5}
          max={100}
          suffix=" %"
          onChange={(value) => onChange({ opacity: value / 100 })}
          onReset={() => onChange({ opacity: 0.72 })}
        />
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-2">
            <span className="text-[11px] text-muted-foreground">Pointillés</span>
            <Switch checked={grid.dashed} onCheckedChange={(value) => onChange({ dashed: value })} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-2">
            <span className="text-[11px] text-muted-foreground">Diagonales</span>
            <Switch checked={grid.diagonals} onCheckedChange={(value) => onChange({ diagonals: value })} />
          </div>
        </div>
      </PanelSection>

      <PanelSection title="Coordonnées" description="Repères de lecture imprimés dans les cases.">
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-2">
          <span className="text-[11px] text-muted-foreground">Afficher les coordonnées</span>
          <Switch checked={grid.coords} onCheckedChange={(value) => onChange({ coords: value })} />
        </div>
        {grid.coords && (
          <>
            <Select value={grid.coordSystem} onValueChange={(value) => onChange({ coordSystem: value })}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="letters">Lettres (A, B, C…)</SelectItem>
                <SelectItem value="numbers">Chiffres (1, 2, 3…)</SelectItem>
                <SelectItem value="both">Combiné : colonnes en lettres, lignes en chiffres</SelectItem>
              </SelectContent>
            </Select>
            <SliderRow
              label="Taille des repères"
              value={grid.coordSize}
              min={8}
              max={40}
              suffix=" px"
              onChange={(value) => onChange({ coordSize: value })}
              onReset={() => onChange({ coordSize: 16 })}
            />
          </>
        )}
      </PanelSection>
    </div>
  );
}