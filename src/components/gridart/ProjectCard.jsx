import { useNavigate } from "@tanstack/react-router";
import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProjectThumb from "@/components/gridart/ProjectThumb";
import { formatDate } from "@/lib/gridart/format";

export default function ProjectCard({ project, onRename, onDuplicate, onDelete }) {
  const navigate = useNavigate();

  const open = () => navigate({ to: "/editor/$projectId", params: { projectId: project.id } });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border/70 bg-card/50 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ProjectThumb project={project} className="aspect-[4/3] border-b border-border/60" />
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">{project.name}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Modifié le {formatDate(project.updated_date)}</p>
        </div>
        {(onRename || onDuplicate || onDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground"
              onClick={(event) => event.stopPropagation()}
              aria-label="Actions du projet"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => onRename(project)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Renommer
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDuplicate(project)}>
              <Copy className="mr-2 h-3.5 w-3.5" />
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onDelete(project)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        )}
      </div>
    </div>
  );
}