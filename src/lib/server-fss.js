import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";

const jsonObject = z.record(z.string(), z.any());

const projectPayload = z.object({
  name: z.string().min(1).max(120),
  image_file_uri: z.string().min(1).max(500),
  image_name: z.string().max(200).optional(),
  image_width: z.number().nonnegative(),
  image_height: z.number().nonnegative(),
  transform: jsonObject.optional(),
  filters: jsonObject.optional(),
  grid: jsonObject.optional(),
  export_settings: jsonObject.optional(),
});

const idInput = z.object({ id: z.string().min(1) });

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(({ context }) => context.getBase44().entities.Project.list("-updated_date", 60));

export const getProject = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(idInput)
  .handler(async ({ data, context }) => {
    try {
      return await context.getBase44().entities.Project.get(data.id);
    } catch (error) {
      if (error?.status === 404) return null;
      throw error;
    }
  });

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(projectPayload)
  .handler(({ data, context }) => context.getBase44().entities.Project.create(data));

export const updateProject = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(projectPayload.partial().extend({ id: z.string().min(1) }))
  .handler(({ data, context }) => {
    const { id, ...patch } = data;
    return context.getBase44().entities.Project.update(id, patch);
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(idInput)
  .handler(({ data, context }) => context.getBase44().entities.Project.delete(data.id));

export const duplicateProject = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(idInput)
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const project = await base44.entities.Project.get(data.id);
    const { id, created_date, updated_date, created_by_id, created_by, ...rest } = project;
    return base44.entities.Project.create({ ...rest, name: `${project.name} (copie)` });
  });

export const getPreference = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const items = await context.getBase44().entities.Preference.list("-created_date", 1);
    return items[0] ?? null;
  });

export const savePreference = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      theme: z.enum(["dark", "light"]).optional(),
      language: z.string().max(10).optional(),
      grid_defaults: jsonObject.optional(),
      export_defaults: jsonObject.optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const items = await base44.entities.Preference.list("-created_date", 1);
    if (items[0]) return base44.entities.Preference.update(items[0].id, data);
    return base44.entities.Preference.create(data);
  });