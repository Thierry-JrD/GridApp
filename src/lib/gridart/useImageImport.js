import { useCallback, useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { createProject } from "@/lib/server-fns";
import { newProjectPayload } from "./defaults";
import { readImageDimensions, uploadProjectImage, validateImageFile } from "./image";

/** Import d'une image puis création du projet correspondant. */
export function useImageImport() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const create = useServerFn(createProject);
  const navigate = useNavigate();
  const router = useRouter();

  const start = useCallback(
    async (file, { gridDefaults, exportDefaults } = {}) => {
      const invalid = validateImageFile(file);
      if (invalid) {
        setError(invalid);
        return;
      }
      setError(null);
      setBusy(true);
      try {
        const { width, height } = await readImageDimensions(file);
        const fileUri = await uploadProjectImage(file);
        const name = (file.name || "Sans titre").replace(/\.[^.]+$/, "").slice(0, 80) || "Sans titre";
        const project = await create({
          data: newProjectPayload({
            name,
            fileUri,
            fileName: file.name,
            width,
            height,
            grid: gridDefaults,
            exportSettings: exportDefaults,
          }),
        });
        await router.invalidate();
        navigate({ to: "/editor/$projectId", params: { projectId: project.id } });
      } catch (thrown) {
        setError(
          thrown?.message
            ? `L'importation a échoué : ${thrown.message}`
            : "L'importation a échoué. Vérifiez votre connexion puis réessayez.",
        );
      } finally {
        setBusy(false);
      }
    },
    [create, navigate, router],
  );

  return { start, busy, error, clearError: () => setError(null) };
}