import { useEffect, useRef } from "react";
import { useProjectImage } from "@/lib/gridart/useProjectImage";
import { buildBase, composeArtwork } from "@/lib/gridart/render";
import { cn } from "@/lib/utils";

export default function ProjectThumb({ project, className }) {
  const { image, loading } = useProjectImage(project.image_file_uri);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const base = buildBase(image, project.transform, project.filters, 560);
    const artwork = composeArtwork(base, project.grid);
    const canvas = canvasRef.current;
    if (!artwork || !canvas) return;
    canvas.width = artwork.width;
    canvas.height = artwork.height;
    canvas.getContext("2d").drawImage(artwork, 0, 0);
  }, [image, project.transform, project.filters, project.grid]);

  return (
    <div className={cn("relative overflow-hidden bg-workspace", className)}>
      <canvas ref={canvasRef} className="h-full w-full object-contain" />
      {loading && <div className="absolute inset-0 animate-pulse bg-secondary/50" />}
    </div>
  );
}