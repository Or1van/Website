"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  characterSchema,
  editionSchema,
  echo,
  fieldErrors,
  idSchema,
  locationSchema,
  trailerSchema,
  type FormState,
} from "@/lib/validation";

type Entity = "character" | "edition" | "location" | "trailer";

const schemas = {
  character: characterSchema,
  edition: editionSchema,
  location: locationSchema,
  trailer: trailerSchema,
} satisfies Record<Entity, z.ZodType>;

// Each entity's table, typed loosely so one code path can serve all four.
type Delegate = {
  create(args: { data: object }): Promise<unknown>;
  update(args: { where: { id: string }; data: object }): Promise<unknown>;
  delete(args: { where: { id: string } }): Promise<unknown>;
};
const tables = (): Record<Entity, Delegate> => ({
  character: db.character as unknown as Delegate,
  edition: db.edition as unknown as Delegate,
  location: db.location as unknown as Delegate,
  trailer: db.trailer as unknown as Delegate,
});

function isEntity(value: unknown): value is Entity {
  return typeof value === "string" && value in schemas;
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function saveEntityAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const entity = formData.get("entity");
  if (!isEntity(entity)) return { message: "Невідомий тип запису." };

  const raw = Object.fromEntries(formData.entries());
  const values = echo(formData, ...formData.keys());
  const parsed = schemas[entity].safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const id = formData.get("id");
  const table = tables()[entity];
  try {
    if (id) {
      const validId = idSchema.safeParse(id);
      if (!validId.success) return { message: "Невірний ідентифікатор.", values };
      await table.update({ where: { id: validId.data }, data: parsed.data });
    } else {
      await table.create({ data: parsed.data });
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { errors: { slug: "Такий slug уже існує." }, values };
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return { message: "Запис уже видалено." };
    }
    throw error;
  }

  refresh();
  return { ok: true, message: id ? "Збережено." : "Створено." };
}

export async function deleteEntityAction(formData: FormData) {
  await requireAdmin();

  const entity = formData.get("entity");
  const id = idSchema.safeParse(formData.get("id"));
  if (!isEntity(entity) || !id.success) return;

  await tables()[entity].delete({ where: { id: id.data } }).catch(() => {});
  refresh();
}
