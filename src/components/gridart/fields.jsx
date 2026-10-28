import { RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function PanelSection({ title, description, action, children, className }) {
  return (
    <section className={cn("space-y-3 border-b border-border/60 pb-4 last:border-0 last:pb-0", className)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[13px] font-semibold tracking-tight text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SliderRow({ label, value, min, max, step = 1, suffix, onChange, onReset, format }) {
  const display = format ? format(value) : `${Math.round(value * 100) / 100}${suffix || ""}`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[11px] tabular-nums text-foreground">{display}</span>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              title="Réinitialiser"
              className="grid h-5 w-5 place-items-center rounded text-muted-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(next) => onChange(next[0])} />
    </div>
  );
}

export function NumberField({ label, value, onChange, min = 1, max = 9999, step = 1, suffix, className }) {
  const commit = (raw) => {
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    onChange(Math.min(max, Math.max(min, parsed)));
  };
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
      )}
      <div className="relative">
        <Input
          type="number"
          inputMode="numeric"
          value={Number.isFinite(value) ? value : ""}
          min={min}
          max={max}
          step={step}
          onChange={(event) => commit(event.target.value)}
          className="h-9 pr-10 font-mono text-[13px] tabular-nums"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}