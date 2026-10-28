import { RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PanelSection, SliderRow } from "@/components/gridart/fields";
import { DEFAULT_FILTERS } from "@/lib/gridart/defaults";

export default function FiltersPanel({ filters, onChange, onReset }) {
  return (
    <div className="space-y-4">
      <PanelSection
        title="Réglages artistiques"
        description="Appliqués à l'aperçu et au fichier exporté. L'original reste intact."
        action={
          <button
            type="button"
            onClick={onReset}
            title="Réinitialiser tous les filtres"
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        }
      >
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-2">
          <div>
            <p className="text-[12px] font-medium">Noir et blanc</p>
            <p className="text-[10.5px] text-muted-foreground">Utile avant de reporter les valeurs</p>
          </div>
          <Switch checked={filters.grayscale} onCheckedChange={(value) => onChange({ grayscale: value })} />
        </div>

        <SliderRow
          label="Luminosité"
          value={filters.brightness}
          min={30}
          max={200}
          suffix=" %"
          onChange={(value) => onChange({ brightness: value })}
          onReset={() => onChange({ brightness: DEFAULT_FILTERS.brightness })}
        />
        <SliderRow
          label="Contraste"
          value={filters.contrast}
          min={30}
          max={220}
          suffix=" %"
          onChange={(value) => onChange({ contrast: value })}
          onReset={() => onChange({ contrast: DEFAULT_FILTERS.contrast })}
        />
        <SliderRow
          label="Saturation"
          value={filters.saturation}
          min={0}
          max={200}
          suffix=" %"
          onChange={(value) => onChange({ saturation: value })}
          onReset={() => onChange({ saturation: DEFAULT_FILTERS.saturation })}
        />
      </PanelSection>

      <PanelSection title="Filtres de dessin" description="Pour préparer une reproduction au trait.">
        <SliderRow
          label="Détection des contours"
          value={filters.edges}
          min={0}
          max={100}
          suffix=" %"
          onChange={(value) => onChange({ edges: value })}
          onReset={() => onChange({ edges: 0 })}
        />
        <SliderRow
          label="Effet croquis"
          value={filters.sketch}
          min={0}
          max={100}
          suffix=" %"
          onChange={(value) => onChange({ sketch: value })}
          onReset={() => onChange({ sketch: 0 })}
        />
        <p className="rounded-lg bg-secondary/40 px-2.5 py-2 text-[10.5px] leading-relaxed text-muted-foreground">
          Les filtres se combinent. Un filtre à 0 % est désactivé.
        </p>
      </PanelSection>

      <Button variant="outline" size="sm" className="w-full text-xs" onClick={onReset}>
        Réinitialiser tous les réglages
      </Button>
    </div>
  );
}