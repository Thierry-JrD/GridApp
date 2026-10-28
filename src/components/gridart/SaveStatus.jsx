import { Check, CircleAlert, Loader2 } from "lucide-react";

const LABELS = {
  idle: { text: "Modifications enregistrées", icon: Check },
  saving: { text: "Enregistrement…", icon: Loader2 },
  saved: { text: "Enregistré", icon: Check },
  error: { text: "Sauvegarde impossible", icon: CircleAlert },
};

export default function SaveStatus({ status }) {
  const entry = LABELS[status] || LABELS.idle;
  const Icon = entry.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] ${
        status === "error" ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      <Icon className={`h-3 w-3 ${status === "saving" ? "animate-spin" : ""}`} />
      <span className="hidden sm:inline">{entry.text}</span>
    </span>
  );
}